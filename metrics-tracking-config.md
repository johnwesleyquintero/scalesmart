# Metrics Tracking Dashboard Configuration

## Overview
This configuration defines automated metrics collection and dashboard setup for tracking refactoring success across your codebase.

## Metrics Collection Scripts

### 1. Code Complexity Metrics
```json
{
  "scripts": {
    "analyze:complexity": "npx complexity-report src/**/*.ts --format json > metrics/complexity-report.json",
    "analyze:coupling": "npx dependency-cruiser src --output-type json > metrics/coupling-report.json",
    "analyze:size": "npx cloc src --json --out=metrics/size-report.json",
    "analyze:all": "npm run analyze:complexity && npm run analyze:coupling && npm run analyze:size"
  }
}
```

### 2. Automated Metrics Collection
```typescript
// scripts/metrics-collector.ts
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

interface ComplexityMetrics {
  averageComplexity: number
  maxComplexity: number
  methodsOverThreshold: number
  totalMethods: number
}

interface FileSizeMetrics {
  filesOverThreshold: Array<{
    path: string
    lines: number
    complexity: number
  }>
  averageFileSize: number
  totalFiles: number
}

interface CouplingMetrics {
  highCouplingModules: Array<{
    module: string
    dependencies: number
    dependents: number
  }>
  circularDependencies: string[][]
  averageCoupling: number
}

export class MetricsCollector {
  private readonly complexityThreshold = 5
  private readonly sizeThreshold = 150
  private readonly couplingThreshold = 10

  async collectComplexityMetrics(): Promise<ComplexityMetrics> {
    try {
      const output = execSync('npx complexity-report src/**/*.ts --format json', {
        encoding: 'utf-8'
      })
      
      const report = JSON.parse(output)
      const methods = this.extractMethods(report)
      
      return {
        averageComplexity: this.calculateAverage(methods.map(m => m.complexity)),
        maxComplexity: Math.max(...methods.map(m => m.complexity)),
        methodsOverThreshold: methods.filter(m => m.complexity > this.complexityThreshold).length,
        totalMethods: methods.length
      }
    } catch (error) {
      console.error('Failed to collect complexity metrics:', error)
      return this.getDefaultComplexityMetrics()
    }
  }

  async collectFileSizeMetrics(): Promise<FileSizeMetrics> {
    try {
      const output = execSync('npx cloc src --json', { encoding: 'utf-8' })
      const report = JSON.parse(output)
      
      const files = this.extractFiles(report)
      const filesOverThreshold = files.filter(f => f.lines > this.sizeThreshold)
      
      return {
        filesOverThreshold: filesOverThreshold.map(f => ({
          path: f.path,
          lines: f.lines,
          complexity: f.complexity || 0
        })),
        averageFileSize: this.calculateAverage(files.map(f => f.lines)),
        totalFiles: files.length
      }
    } catch (error) {
      console.error('Failed to collect file size metrics:', error)
      return this.getDefaultFileSizeMetrics()
    }
  }

  async collectCouplingMetrics(): Promise<CouplingMetrics> {
    try {
      const output = execSync('npx dependency-cruiser src --output-type json', {
        encoding: 'utf-8'
      })
      
      const report = JSON.parse(output)
      const modules = this.extractModules(report)
      
      return {
        highCouplingModules: modules
          .filter(m => m.dependencies > this.couplingThreshold || m.dependents > this.couplingThreshold)
          .map(m => ({
            module: m.name,
            dependencies: m.dependencies,
            dependents: m.dependents
          })),
        circularDependencies: this.findCircularDependencies(report),
        averageCoupling: this.calculateAverage(modules.map(m => m.dependencies + m.dependents))
      }
    } catch (error) {
      console.error('Failed to collect coupling metrics:', error)
      return this.getDefaultCouplingMetrics()
    }
  }

  async saveMetrics(metrics: any, filename: string): Promise<void> {
    const timestamp = new Date().toISOString()
    const data = {
      timestamp,
      metrics,
      version: '1.0.0'
    }
    
    await fs.writeFile(
      path.join(process.cwd(), 'metrics', filename),
      JSON.stringify(data, null, 2)
    )
  }

  private extractMethods(report: any): Array<{ complexity: number }> {
    // Extract method complexity from complexity report
    return report.functions || []
  }

  private extractFiles(report: any): Array<{ path: string; lines: number }> {
    // Extract file information from cloc report
    return Object.entries(report).map(([path, data]: [string, any]) => ({
      path,
      lines: data.code || 0
    }))
  }

  private extractModules(report: any): Array<{ name: string; dependencies: number; dependents: number }> {
    // Extract module coupling information
    return report.modules || []
  }

  private findCircularDependencies(report: any): string[][] {
    // Find circular dependencies in the report
    return report.circulars || []
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  private getDefaultComplexityMetrics(): ComplexityMetrics {
    return {
      averageComplexity: 0,
      maxComplexity: 0,
      methodsOverThreshold: 0,
      totalMethods: 0
    }
  }

  private getDefaultFileSizeMetrics(): FileSizeMetrics {
    return {
      filesOverThreshold: [],
      averageFileSize: 0,
      totalFiles: 0
    }
  }

  private getDefaultCouplingMetrics(): CouplingMetrics {
    return {
      highCouplingModules: [],
      circularDependencies: [],
      averageCoupling: 0
    }
  }
}

// Usage
export async function collectAllMetrics(): Promise<void> {
  const collector = new MetricsCollector()
  
  const complexity = await collector.collectComplexityMetrics()
  const fileSize = await collector.collectFileSizeMetrics()
  const coupling = await collector.collectCouplingMetrics()
  
  await collector.saveMetrics(complexity, 'complexity-metrics.json')
  await collector.saveMetrics(fileSize, 'file-size-metrics.json')
  await collector.saveMetrics(coupling, 'coupling-metrics.json')
  
  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    complexity,
    fileSize,
    coupling,
    refactoringProgress: calculateRefactoringProgress(complexity, fileSize, coupling)
  }
  
  await collector.saveMetrics(summary, 'refactoring-summary.json')
}

function calculateRefactoringProgress(
  complexity: ComplexityMetrics,
  fileSize: FileSizeMetrics,
  coupling: CouplingMetrics
): number {
  // Calculate overall refactoring progress score (0-100)
  const complexityScore = Math.max(0, 100 - (complexity.methodsOverThreshold / complexity.totalMethods) * 100)
  const fileSizeScore = Math.max(0, 100 - (fileSize.filesOverThreshold.length / fileSize.totalFiles) * 100)
  const couplingScore = Math.max(0, 100 - (coupling.highCouplingModules.length / 50) * 100)
  
  return Math.round((complexityScore + fileSizeScore + couplingScore) / 3)
}
```

## 3. GitHub Actions Workflow for Automated Tracking

```yaml
# .github/workflows/metrics-tracking.yml
name: Code Quality Metrics Tracking

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday at 2 AM

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Collect metrics
      run: |
        npm run analyze:all
        node scripts/metrics-collector.js
    
    - name: Upload metrics artifacts
      uses: actions/upload-artifact@v3
      with:
        name: metrics-reports
        path: |
          metrics/complexity-metrics.json
          metrics/file-size-metrics.json
          metrics/coupling-metrics.json
          metrics/refactoring-summary.json
    
    - name: Comment PR with metrics
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const summary = JSON.parse(fs.readFileSync('metrics/refactoring-summary.json', 'utf8'));
          
          const comment = `## 📊 Code Quality Metrics
          
          **Refactoring Progress**: ${summary.refactoringProgress}%
          
          ### Complexity Metrics
          - Average Complexity: ${summary.complexity.averageComplexity}
          - Methods Over Threshold: ${summary.complexity.methodsOverThreshold}/${summary.complexity.totalMethods}
          
          ### File Size Metrics
          - Files Over Threshold: ${summary.fileSize.filesOverThreshold.length}
          - Average File Size: ${summary.fileSize.averageFileSize} lines
          
          ### Coupling Metrics
          - High Coupling Modules: ${summary.coupling.highCouplingModules.length}
          - Circular Dependencies: ${summary.coupling.circularDependencies.length}
          `;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });

  generate-dashboard:
    needs: collect-metrics
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download metrics artifacts
      uses: actions/download-artifact@v3
      with:
        name: metrics-reports
        path: metrics
    
    - name: Generate dashboard data
      run: node scripts/generate-dashboard-data.js
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dashboard
```

## 4. Dashboard Visualization

```typescript
// scripts/generate-dashboard-data.ts
import fs from 'fs/promises'
import path from 'path'

interface DashboardData {
  timeline: Array<{
    date: string
    complexity: number
    fileSize: number
    coupling: number
    progress: number
  }>
  current: {
    complexity: ComplexityMetrics
    fileSize: FileSizeMetrics
    coupling: CouplingMetrics
  }
  recommendations: string[]
}

export async function generateDashboardData(): Promise<void> {
  const metricsDir = path.join(process.cwd(), 'metrics')
  const files = await fs.readdir(metricsDir)
  
  const timeline = await Promise.all(
    files
      .filter(f => f.endsWith('refactoring-summary.json'))
      .sort()
      .map(async (file) => {
        const content = await fs.readFile(path.join(metricsDir, file), 'utf-8')
        const data = JSON.parse(content)
        return {
          date: data.timestamp,
          complexity: data.complexity.averageComplexity,
          fileSize: data.fileSize.filesOverThreshold.length,
          coupling: data.coupling.highCouplingModules.length,
          progress: data.refactoringProgress
        }
      })
  )
  
  const current = timeline[timeline.length - 1]
  const recommendations = generateRecommendations(current)
  
  const dashboardData: DashboardData = {
    timeline,
    current: {
      complexity: current.complexity,
      fileSize: current.fileSize,
      coupling: current.coupling
    },
    recommendations
  }
  
  await fs.writeFile(
    path.join(process.cwd(), 'dashboard', 'data.json'),
    JSON.stringify(dashboardData, null, 2)
  )
}

function generateRecommendations(current: any): string[] {
  const recommendations: string[] = []
  
  if (current.complexity > 5) {
    recommendations.push('Reduce method complexity - consider extracting helper methods')
  }
  
  if (current.fileSize > 10) {
    recommendations.push('Split large files - consider extracting to separate modules')
  }
  
  if (current.coupling > 5) {
    recommendations.push('Reduce module coupling - implement dependency injection')
  }
  
  return recommendations
}
```

## 5. Alert Configuration

```typescript
// scripts/metrics-alerts.ts
export class MetricsAlerts {
  private readonly complexityThreshold = 7
  private readonly fileSizeThreshold = 15
  private readonly couplingThreshold = 10
  private readonly progressThreshold = 60

  async checkAlerts(metrics: any): Promise<string[]> {
    const alerts: string[] = []
    
    if (metrics.complexity.averageComplexity > this.complexityThreshold) {
      alerts.push(`⚠️ High complexity detected: ${metrics.complexity.averageComplexity}`)
    }
    
    if (metrics.fileSize.filesOverThreshold.length > this.fileSizeThreshold) {
      alerts.push(`⚠️ Too many large files: ${metrics.fileSize.filesOverThreshold.length}`)
    }
    
    if (metrics.coupling.highCouplingModules.length > this.couplingThreshold) {
      alerts.push(`⚠️ High coupling detected: ${metrics.coupling.highCouplingModules.length} modules`)
    }
    
    if (metrics.refactoringProgress < this.progressThreshold) {
      alerts.push(`⚠️ Low refactoring progress: ${metrics.refactoringProgress}%`)
    }
    
    return alerts
  }

  async sendAlerts(alerts: string[]): Promise<void> {
    if (alerts.length === 0) return
    
    const message = alerts.join('\n')
    
    // Send to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Code Quality Alert:\n${message}`,
          channel: '#engineering'
        })
      })
    }
    
    // Send to email (if configured)
    if (process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true') {
      // Implement email notification
    }
  }
}
```

## Usage Instructions

1. **Install Dependencies**:
   ```bash
   npm install --save-dev complexity-report dependency-cruiser cloc
   ```

2. **Create Metrics Directory**:
   ```bash
   mkdir metrics
   mkdir dashboard
   ```

3. **Run Initial Analysis**:
   ```bash
   npm run analyze:all
   node scripts/metrics-collector.js
   ```

4. **Set Up GitHub Secrets**:
   - `SLACK_WEBHOOK_URL`: For notifications
   - `EMAIL_NOTIFICATIONS_ENABLED`: Set to 'true' for email alerts

5. **Monitor Progress**:
   - Check `metrics/refactoring-summary.json` for current progress
   - Review dashboard at `dashboard/index.html`
   - Monitor GitHub Actions for automated reports

This metrics tracking system will provide continuous visibility into your refactoring progress and help maintain code quality standards.