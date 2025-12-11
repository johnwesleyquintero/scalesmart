# Refactoring Implementation Guide

## Critical Refactoring: IndexedDB Service (Priority 1)

### Current Issues
The `src/lib/indexeddb-service.ts` file is a 622-line monolithic service that violates multiple SOLID principles:

1. **Single Responsibility Violation**: Handles 6 different data stores
2. **Open/Closed Violation**: Adding new stores requires modifying the core service
3. **High Coupling**: 5 files directly depend on this service
4. **Feature Envy**: Contains business logic that should be in domain models

### Step-by-Step Refactoring Plan

#### Phase 1: Extract Repository Interfaces (Day 1-2)

```typescript
// src/lib/repositories/interfaces.ts
export interface IRepository<T, K = string> {
  getAll(): Promise<T[]>
  getById(id: K): Promise<T | undefined>
  save(entity: T): Promise<K>
  delete(id: K): Promise<void>
  bulkSave(entities: T[]): Promise<void>
}

export interface ISyncableRepository<T, K = string> extends IRepository<T, K> {
  getUnsynced(): Promise<T[]>
  markAsSynced(id: K): Promise<void>
}
```

#### Phase 2: Create Base Repository (Day 3)

```typescript
// src/lib/repositories/base-repository.ts
import { db } from '@/lib/indexeddb-service'

export abstract class BaseRepository<T extends { id?: K }, K = string> 
  implements IRepository<T, K> {
  
  constructor(protected storeName: string) {}

  async getAll(): Promise<T[]> {
    return db.table<T>(this.storeName).toArray()
  }

  async getById(id: K): Promise<T | undefined> {
    return db.table<T>(this.storeName).get(id)
  }

  async save(entity: T): Promise<K> {
    return db.table<T>(this.storeName).put(entity)
  }

  async delete(id: K): Promise<void> {
    await db.table<T>(this.storeName).delete(id)
  }

  async bulkSave(entities: T[]): Promise<void> {
    await db.table<T>(this.storeName).bulkPut(entities)
  }
}
```

#### Phase 3: Implement Specific Repositories (Day 4-7)

```typescript
// src/lib/repositories/dashboard-repository.ts
export class DashboardRepository 
  extends BaseRepository<Dashboard, string> 
  implements ISyncableRepository<Dashboard, string> {
  
  constructor() {
    super('dashboards')
  }

  async getUnsynced(): Promise<Dashboard[]> {
    return db.table<Dashboard>(this.storeName)
      .where('synced').equals(0).toArray()
  }

  async markAsSynced(id: string): Promise<void> {
    const dashboard = await this.getById(id)
    if (dashboard) {
      await this.save({ ...dashboard, synced: 1 })
    }
  }

  // Domain-specific methods
  async getByName(name: string): Promise<Dashboard | undefined> {
    return db.table<Dashboard>(this.storeName)
      .where('name').equals(name).first()
  }
}

// src/lib/repositories/prediction-repository.ts
export class PredictionRepository 
  extends BaseRepository<Prediction, string>
  implements ISyncableRepository<Prediction, string> {
  
  constructor() {
    super('predictions')
  }

  async savePrediction(data: Omit<Prediction, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const prediction: Prediction = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: 0
    }
    await this.save(prediction)
    return prediction.id
  }
}
```

#### Phase 4: Create Repository Factory (Day 8)

```typescript
// src/lib/repositories/repository-factory.ts
export class RepositoryFactory {
  private static repositories: Map<string, IRepository<any>> = new Map()

  static getDashboardRepository(): DashboardRepository {
    if (!this.repositories.has('dashboards')) {
      this.repositories.set('dashboards', new DashboardRepository())
    }
    return this.repositories.get('dashboards') as DashboardRepository
  }

  static getPredictionRepository(): PredictionRepository {
    if (!this.repositories.has('predictions')) {
      this.repositories.set('predictions', new PredictionRepository())
    }
    return this.repositories.get('predictions') as PredictionRepository
  }

  // Add other repositories...
}
```

#### Phase 5: Migration Strategy (Day 9-14)

```typescript
// Create compatibility layer
export class IndexedDBService {
  // Keep existing API but delegate to repositories
  private dashboardRepo = RepositoryFactory.getDashboardRepository()
  private predictionRepo = RepositoryFactory.getPredictionRepository()

  // Existing methods now delegate to repositories
  async saveDashboardConfig(dashboardData: Omit<Dashboard, 'synced'>): Promise<string> {
    return this.dashboardRepo.save({ ...dashboardData, synced: 0 })
  }

  async getDashboardConfig(id: string): Promise<Dashboard | undefined> {
    return this.dashboardRepo.getById(id)
  }

  // Gradually migrate all methods...
}
```

### Testing Strategy

#### Unit Tests for Repositories
```typescript
// __tests__/repositories/dashboard-repository.test.ts
describe('DashboardRepository', () => {
  let repository: DashboardRepository

  beforeEach(() => {
    repository = new DashboardRepository()
    // Mock IndexedDB
  })

  it('should save and retrieve dashboard', async () => {
    const dashboard = { id: 'test-1', name: 'Test Dashboard', synced: 0 }
    await repository.save(dashboard)
    
    const retrieved = await repository.getById('test-1')
    expect(retrieved).toEqual(dashboard)
  })

  it('should get unsynced dashboards', async () => {
    await repository.save({ id: '1', name: 'Dashboard 1', synced: 0 })
    await repository.save({ id: '2', name: 'Dashboard 2', synced: 1 })
    
    const unsynced = await repository.getUnsynced()
    expect(unsynced).toHaveLength(1)
    expect(unsynced[0].id).toBe('1')
  })
})
```

### Success Metrics
- **File Size**: Reduce from 622 lines to < 150 lines per repository
- **Complexity**: Cyclomatic complexity < 5 per method
- **Test Coverage**: Achieve 90% coverage for repository layer
- **Dependencies**: Reduce coupling by 60%

## Critical Refactoring: Prompt Request Generator (Priority 2)

### Current Issues
The `src/app/prompt-request-generator/page.tsx` component has 159 lines with multiple responsibilities:

1. **Violation of SRP**: UI rendering mixed with business logic
2. **High Coupling**: Directly tied to complex hook implementation
3. **Low Cohesion**: Handles 15+ different state operations

### Refactoring Implementation

#### Step 1: Extract Container Component
```typescript
// src/app/prompt-request-generator/container.tsx
export function PromptRequestGeneratorContainer() {
  const hook = usePromptGenerator()
  
  return (
    <PromptRequestGeneratorLayout
      promptData={hook.promptData}
      output={hook.output}
      onGenerate={hook.generatePromptHandler}
      onSave={hook.handleSaveRequest}
      // Pass only necessary props
    />
  )
}
```

#### Step 2: Create Presentational Components
```typescript
// src/app/prompt-request-generator/components/layout.tsx
interface Props {
  promptData: PromptData
  output: string
  onGenerate: () => void
  onSave: () => void
  // Only necessary props
}

export function PromptRequestGeneratorLayout({
  promptData,
  output,
  onGenerate,
  onSave
}: Props) {
  return (
    <div className="container">
      <Header />
      <div className="grid grid-cols-2 gap-8">
        <InputSection promptData={promptData} />
        <OutputSection output={output} />
      </div>
      <ActionButtons onGenerate={onGenerate} onSave={onSave} />
    </div>
  )
}
```

#### Step 3: Extract Business Logic Hooks
```typescript
// src/hooks/use-prompt-validation.ts
export function usePromptValidation() {
  const validate = useCallback((data: PromptData) => {
    const errors: ValidationErrors = {}
    
    if (!data.category) {
      errors.category = "Please select a category"
    }
    
    if (!data.request.trim()) {
      errors.request = "Request field is required"
    }
    
    return errors
  }, [])
  
  return { validate }
}

// src/hooks/use-prompt-generation.ts
export function usePromptGeneration() {
  const generate = useCallback(async (data: PromptData) => {
    // Extract generation logic from main hook
    return generatePrompt(data)
  }, [])
  
  return { generate }
}
```

### Testing Implementation

```typescript
// __tests__/prompt-request-generator/layout.test.tsx
describe('PromptRequestGeneratorLayout', () => {
  it('should render all sections', () => {
    render(
      <PromptRequestGeneratorLayout
        promptData={mockPromptData}
        output="Generated prompt"
        onGenerate={jest.fn()}
        onSave={jest.fn()}
      />
    )
    
    expect(screen.getByText('Prompt Request Generator')).toBeInTheDocument()
    expect(screen.getByLabelText('Request Details')).toBeInTheDocument()
    expect(screen.getByLabelText('Generated Prompt')).toBeInTheDocument()
  })
  
  it('should call onGenerate when generate button clicked', () => {
    const onGenerate = jest.fn()
    render(<PromptRequestGeneratorLayout {...defaultProps} onGenerate={onGenerate} />)
    
    fireEvent.click(screen.getByText('Generate'))
    expect(onGenerate).toHaveBeenCalled()
  })
})
```

## Data Connector Service Refactoring (Priority 3)

### Strategy Pattern Implementation

```typescript
// src/lib/connectors/interfaces.ts
export interface DataConnectorStrategy {
  connect(details: ConnectionDetails): Promise<void>
  disconnect(): Promise<void>
  executeQuery(query: DataQuery): Promise<QueryResult>
  supportsStreaming(): boolean
}

// src/lib/connectors/csv-connector.ts
export class CSVConnectorStrategy implements DataConnectorStrategy {
  private papa: typeof Papa
  
  constructor() {
    this.papa = Papa
  }
  
  async connect(details: ConnectionDetails): Promise<void> {
    // CSV-specific connection logic
    console.log('CSV connector ready')
  }
  
  async executeQuery(query: DataQuery): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      this.papa.parse(query.content, {
        header: true,
        complete: (results) => {
          resolve(this.transformResults(results))
        },
        error: (error) => reject(error)
      })
    })
  }
  
  private transformResults(results: Papa.ParseResult): QueryResult {
    // Transform CSV results to standard format
    const columns = results.meta.fields?.map(field => ({
      name: field,
      type: 'string' // Infer types in production
    })) || []
    
    return {
      columns,
      rows: results.data as unknown[][]
    }
  }
}
```

### Factory Pattern for Connectors

```typescript
// src/lib/connectors/connector-factory.ts
export class ConnectorFactory {
  static createConnector(type: DataSourceType): DataConnectorStrategy {
    switch (type) {
      case DataSourceType.LocalCSV:
        return new CSVConnectorStrategy()
      case DataSourceType.IndexedDB:
        return new IndexedDBConnectorStrategy()
      default:
        throw new Error(`Unsupported connector type: ${type}`)
    }
  }
}
```

## Migration Checklist

### Pre-Migration
- [ ] Create comprehensive backup of current implementation
- [ ] Set up feature flags for gradual rollout
- [ ] Implement monitoring for performance metrics
- [ ] Create rollback plan

### During Migration
- [ ] Maintain backward compatibility
- [ ] Implement dual-write patterns where necessary
- [ ] Monitor error rates and performance
- [ ] Document API changes

### Post-Migration
- [ ] Remove deprecated code paths
- [ ] Update documentation
- [ ] Conduct performance testing
- [ ] Gather team feedback

## Quality Gates

### Code Quality Metrics
- **Cyclomatic Complexity**: < 5 per method
- **Method Length**: < 15 lines
- **File Length**: < 150 lines
- **Dependencies**: < 5 per module

### Testing Requirements
- **Unit Test Coverage**: > 90%
- **Integration Test Coverage**: > 80%
- **Performance Tests**: Pass baseline benchmarks
- **Security Tests**: No new vulnerabilities

### Review Process
1. **Peer Review**: All refactoring requires 2 approvals
2. **Architecture Review**: Major changes need architect approval
3. **Performance Review**: Load testing for data access changes
4. **Security Review**: Security team sign-off for external interfaces

This implementation guide provides a systematic approach to refactoring your most critical code while maintaining system stability and improving long-term maintainability.