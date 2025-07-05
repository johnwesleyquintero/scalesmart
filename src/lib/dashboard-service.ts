import {
  DataQuery,
  QueryResult,
} from '../app/dashboard-studio/data-source-types';
import { validateFormula, evaluateFormula } from './formula-evaluator';
import { DataConnectorService } from './data-connector-service';
import { Layout } from 'react-grid-layout';
import { WidgetConfig } from '../app/dashboard-studio/widget-types';
import { getItem, setItem, getAllItems } from './indexeddb-service';
import { Dashboard } from '@/types/indexeddb'; // Import Dashboard interface

/**
 * Applies a formula to each record in a dataset.
 * @param data The dataset to process.
 * @param formula The formula string to apply.
 * @returns A new array with the formula applied to each record.
 */

const DASHBOARD_STORE_NAME = 'dashboards';
const DASHBOARD_TEMPLATE_STORE_NAME = 'dashboardTemplates';

export const DashboardService = {
  /**
   * Applies a formula to each record in a dataset.
   * @param data The dataset to process.
   * @param formula The formula string to apply.
   * @returns A new array with the formula applied to each record.
   */
  applyFormulaToDataset(
    data: Record<string, unknown>[],
    formula: string,
  ): unknown[] {
    return data.map((record) => this.evaluateFormulaOnRecord(formula, record));
  },
  /**
   * Evaluates a given formula against a single data record.
   * @param formula The formula string to evaluate.
   * @param record The data record to use as context for evaluation.
   * @returns The result of the formula evaluation, or an error string.
   */
  evaluateFormulaOnRecord(
    formula: string,
    record: Record<string, unknown>,
  ): unknown {
    return evaluateFormula(formula, record);
  },

  async getDashboard(id: string): Promise<Dashboard | undefined> {
    return getItem<Dashboard>(DASHBOARD_STORE_NAME, id);
  },

  async getDashboardWidgets(dashboardId: string): Promise<WidgetConfig[]> {
    const dashboard = await getItem<Dashboard>(
      DASHBOARD_STORE_NAME,
      dashboardId,
    );
    return dashboard ? dashboard.widgets : [];
  },

  async saveDashboard(dashboard: Dashboard): Promise<Dashboard> {
    await setItem<Dashboard>(DASHBOARD_STORE_NAME, dashboard);
    return dashboard;
  },

  async createDashboard(name: string): Promise<Dashboard> {
    const newDashboardId = `dashboard-${Date.now()}`;
    const newDashboard: Dashboard = {
      id: newDashboardId,
      name,
      widgets: [],
      layout: { i: newDashboardId, x: 0, y: 0, w: 12, h: 8 }, // Example layout
    };
    await setItem<Dashboard>(DASHBOARD_STORE_NAME, newDashboard);
    return newDashboard;
  },

  async saveDashboardAsTemplate(
    dashboard: Dashboard,
    templateName: string,
  ): Promise<void> {
    const template: Dashboard = { ...dashboard, name: templateName };
    await setItem<Dashboard>(DASHBOARD_TEMPLATE_STORE_NAME, template);
    console.log(
      `Saving dashboard "${dashboard.name}" as template "${templateName}"`,
    );
  },

  async getDashboardTemplates(): Promise<Dashboard[]> {
    return getAllItems<Dashboard>(DASHBOARD_TEMPLATE_STORE_NAME);
  },

  async loadDashboardTemplate(
    templateId: string,
  ): Promise<Dashboard | undefined> {
    return getItem<Dashboard>(DASHBOARD_TEMPLATE_STORE_NAME, templateId);
  },

  async fetchHistoricalData(
    query: DataQuery,
    timeRange: { start: Date; end: Date },
  ): Promise<QueryResult> {
    console.log(
      'Fetching historical data for query:',
      query,
      'in time range:',
      timeRange,
    );
    // For local applications, historical data would typically come from IndexedDB or loaded CSVs.
    // This is a placeholder for actual IndexedDB query logic.
    const simulatedHistoricalData = [
      { date: timeRange.start.toISOString(), value: Math.random() * 50 },
      {
        date: new Date(
          (timeRange.start.getTime() + timeRange.end.getTime()) / 2,
        ).toISOString(),
        value: Math.random() * 60,
      },
      { date: timeRange.end.toISOString(), value: Math.random() * 70 },
    ];
    const columns = Object.keys(simulatedHistoricalData[0]).map((key) => ({
      name: key,
      type: typeof simulatedHistoricalData[0][
        key as keyof (typeof simulatedHistoricalData)[0]
      ],
    }));
    const rows = simulatedHistoricalData.map((item) => Object.values(item));
    return { columns, rows };
  },
};

/**
 * Processes a QueryResult by applying a formula to each row.
 * @param data The QueryResult containing the data to process.
 * @param formula The formula string to apply.
 * @param newColumnName The name for the new column containing the formula results.
 * @returns A new QueryResult with the formula results added as a new column.
 */
export const processDataWithFormula = (
  data: QueryResult,
  formula: string,
  newColumnName: string = 'CalculatedValue',
): QueryResult => {
  if (!data || !data.rows || data.rows.length === 0) {
    console.warn('No data available to process formula.');
    return data; // Return original data if no rows
  }

  // Validate the formula once before processing rows
  const columns = data.columns.map((col) => col.name);
  const validationError = validateFormula(formula, columns);
  if (validationError) {
    console.error(
      'Formula validation failed:',
      formula,
      'Error:',
      validationError,
    );
    // Return original data with an error indicator or throw an error
    // For now, we'll return original data and log the error.
    // A more robust implementation might add an error column or throw.
    return {
      ...data,
      columns: [...data.columns, { name: newColumnName, type: 'string' }],
      rows: data.rows.map((row) => [...row, `Error: ${validationError}`]),
    };
  }

  const processedRows = data.rows.map((row, rowIndex) => {
    const record: Record<string, unknown> = {};
    columns.forEach((colName, colIndex) => {
      record[colName] = row[colIndex];
    });

    // Evaluate the formula for the current row
    const evaluationResult = DashboardService.evaluateFormulaOnRecord(
      formula,
      record,
    );

    // Return the original row plus the evaluation result
    return [...row, evaluationResult];
  });

  // Add the new column definition
  const processedColumns = [
    ...data.columns,
    {
      name: newColumnName,
      type: typeof processedRows[0][processedRows[0].length - 1],
    }, // Infer type from first result
  ];

  return {
    columns: processedColumns,
    rows: processedRows,
  };
};

// In-memory storage for refresh intervals and timers
const activeRefreshTimers: Map<string, number> = new Map();

// Removed placeholder function for fetching dashboard data as it's no longer needed with IndexedDB integration.

export const DataRefreshService = {
  startDataRefresh(dashboardId: string, intervalSeconds: number): void {
    // Clear any existing timer for this dashboard
    if (activeRefreshTimers.has(dashboardId)) {
      clearInterval(activeRefreshTimers.get(dashboardId)!);
    }

    if (intervalSeconds <= 0) {
      console.log(
        `Refresh interval for dashboard ${dashboardId} is not positive. Skipping scheduled refresh.`,
      );
      return;
    }

    const intervalId = setInterval(async () => {
      console.log(`Refreshing data for dashboard: ${dashboardId}`);
      try {
        const dashboard = await DashboardService.getDashboard(dashboardId);
        if (!dashboard) {
          console.warn(
            `Dashboard with ID ${dashboardId} not found for refresh.`,
          );
          return;
        }

        for (const widget of dashboard.widgets) {
          if (widget.dataSource && widget.dataSource.query) {
            try {
              const queryResult = await DataConnectorService.executeQuery(
                widget.dataSource.query,
              );
              console.log(
                `Data refreshed for widget ${widget.id} in dashboard ${dashboardId}:`,
                queryResult,
              );
              // In a real application, this queryResult would be dispatched to a state management system
              // (e.g., a Zustand store, React context, or Redux) to update the widget's displayed data.
            } catch (widgetError) {
              console.error(
                `Error refreshing data for widget ${widget.id}:`,
                widgetError,
              );
            }
          }
        }
      } catch (dashboardError) {
        console.error(
          `Error during dashboard data refresh for ${dashboardId}:`,
          dashboardError,
        );
      }
    }, intervalSeconds * 1000); // Convert seconds to milliseconds

    activeRefreshTimers.set(dashboardId, intervalId as unknown as number);
    console.log(
      `Started data refresh for dashboard ${dashboardId} with interval ${intervalSeconds} seconds.`,
    );
  },

  stopDataRefresh(dashboardId: string): void {
    if (activeRefreshTimers.has(dashboardId)) {
      clearInterval(activeRefreshTimers.get(dashboardId)!);
      activeRefreshTimers.delete(dashboardId);
      console.log(`Stopped data refresh for dashboard ${dashboardId}.`);
    } else {
      console.warn(
        `No active refresh timer found for dashboard ID: ${dashboardId}.`,
      );
    }
  },

  // Method to handle near real-time refresh using streaming (integrates with DataConnectorService)
  startRealtimeDataStream(
    query: DataQuery,
    onData: (data: QueryResult) => void,
    onError: (error: unknown) => void,
  ): () => void {
    console.log(`Starting real-time data stream for query:`, query);
    // This directly uses the subscribeToData method from DataConnectorService
    return DataConnectorService.subscribeToData(query, onData, onError);
  },

  // Method to stop real-time data stream (the unsubscribe function returned by startRealtimeDataStream)
  stopRealtimeDataStream(unsubscribe: () => void): void {
    console.log('Stopping real-time data stream.');
    unsubscribe();
  },
};
