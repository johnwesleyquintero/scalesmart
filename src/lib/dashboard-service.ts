import {
  DataQuery,
  QueryResult,
} from '../app/dashboard-studio/data-source-types';
import { DataConnectorService } from './data-connector-service';
import { Layout } from 'react-grid-layout';
import { WidgetConfig } from '../app/dashboard-studio/widget-types';
import { evaluateFormula } from './formula-evaluator'; // Import the formula evaluator

export interface Dashboard {
  id: string;
  name: string;
  widgets: WidgetConfig[]; // Define a more specific type for widgets
  layout: Layout; // Define a more specific type for layout
  refreshInterval?: number; // Refresh interval in seconds (optional)
}

const EXAMPLE_DASHBOARD_ID = 'example-dashboard-id';

export const DashboardService = {
  // This might involve modifying data fetching or processing functions
  // to apply user-defined formulas using the logic in src/lib/formula-evaluator.ts.

  // Function to apply formulas to a dataset
  applyFormulasToData(
    data: QueryResult,
    formulas: { [key: string]: string },
  ): QueryResult {
    if (!formulas || Object.keys(formulas).length === 0) {
      return data; // No formulas to apply
    }

    const processedData: QueryResult = { ...data, rows: [] };

    data.rows.forEach((row) => {
      const newRow: Record<string, string | number | null> = { ...row };
      for (const formulaKey in formulas) {
        const formulaExpression = formulas[formulaKey];
        try {
          // Create a context for formula evaluation using existing row values
          const context: Record<string, string | number> = {};
          for (const key in row) {
            if (typeof row[key] === 'string' || typeof row[key] === 'number') {
              context[key] = row[key];
            }
          }
          newRow[formulaKey] = evaluateFormula(formulaExpression, context) as
            | string
            | number
            | null;
        } catch (error) {
          console.error(
            `Error evaluating formula '${formulaExpression}' for key '${formulaKey}':`,
            error,
          );
          newRow[formulaKey] = null; // Or some other error indicator
        }
      }
      processedData.rows.push(newRow);
    });

    // Add new formula keys to headers if they don't exist
    const newHeaders = [...data.headers];
    for (const formulaKey in formulas) {
      if (!newHeaders.includes(formulaKey)) {
        newHeaders.push(formulaKey);
      }
    }
    processedData.headers = newHeaders;

    return processedData;
  },
  async getDashboard(id: string): Promise<Dashboard | null> {
    // Simulate API call to fetch a dashboard
    return new Promise((resolve) => {
      setTimeout(() => {
        if (id === EXAMPLE_DASHBOARD_ID) {
          resolve({
            id: EXAMPLE_DASHBOARD_ID,
            name: 'My Example Dashboard',
            widgets: [],
            layout: { i: EXAMPLE_DASHBOARD_ID, x: 0, y: 0, w: 12, h: 8 }, // Example layout
          });
        } else {
          resolve(null);
        }
      }, 500);
    });
  },

  async saveDashboard(dashboard: Dashboard): Promise<Dashboard> {
    // Simulate API call to save a dashboard
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Saving dashboard:', dashboard);
        resolve(dashboard);
      }, 500);
    });
  },

  async createDashboard(name: string): Promise<Dashboard> {
    // Simulate API call to create a new dashboard
    return new Promise((resolve) => {
      const newDashboardId = `dashboard-${Date.now()}`;
      const newDashboard: Dashboard = {
        id: newDashboardId,
        name,
        widgets: [],
        layout: { i: newDashboardId, x: 0, y: 0, w: 12, h: 8 }, // Example layout
      };
      setTimeout(() => {
        console.log('Creating new dashboard:', newDashboard);
        resolve(newDashboard);
      }, 500);
    });
  },

  async saveDashboardAsTemplate(
    dashboard: Dashboard,
    templateName: string,
  ): Promise<void> {
    // Simulate saving a dashboard as a template
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `Saving dashboard "${dashboard.name}" as template "${templateName}"`,
        );
        // In a real application, you would store the dashboard configuration
        // associated with the templateName.
        resolve();
      }, 500);
    });
  },

  async getDashboardTemplates(): Promise<Dashboard[]> {
    // Simulate fetching a list of available templates
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Fetching dashboard templates');
        // Simulate returning some dummy templates
        const dummyTemplates: Dashboard[] = [
          {
            id: 'template-sales',
            name: 'Sales Overview Template',
            widgets: [
              // Example widgets for a sales template
              {
                id: 'chart-1',
                type: 'CHART',
                title: 'Monthly Sales',
                x: 0,
                y: 0,
                w: 6,
                h: 4,
                data: {
                  labels: ['Jan', 'Feb', 'Mar'],
                  datasets: [{ label: 'Sales', data: [100, 200, 150] }],
                },
                chartType: 'bar',
              },
              {
                id: 'kpi-1',
                type: 'KPI',
                title: 'Total Revenue',
                x: 6,
                y: 0,
                w: 3,
                h: 2,
                data: { value: '$15000', label: 'Revenue' },
              },
              {
                id: 'table-1',
                type: 'TABLE',
                title: 'Sales Data',
                x: 0,
                y: 4,
                w: 12,
                h: 6,
                data: {
                  headers: ['Product', 'Quantity', 'Price'],
                  rows: [
                    ['A', '10', '100'],
                    ['B', '5', '200'],
                  ],
                },
              },
            ],
            layout: { i: 'template-sales', x: 0, y: 0, w: 12, h: 10 }, // Example layout
          },
          {
            id: 'template-marketing',
            name: 'Marketing Performance Template',
            widgets: [
              // Example widgets for a marketing template
              {
                id: 'chart-2',
                type: 'CHART',
                title: 'Website Traffic',
                x: 0,
                y: 0,
                w: 6,
                h: 4,
                data: {
                  labels: ['Jan', 'Feb', 'Mar'],
                  datasets: [{ label: 'Visits', data: [500, 700, 600] }],
                },
                chartType: 'line',
              },
              {
                id: 'kpi-2',
                type: 'KPI',
                title: 'New Leads',
                x: 6,
                y: 0,
                w: 3,
                h: 2,
                data: { value: '50', label: 'Leads' },
              },
            ],
            layout: { i: 'template-marketing', x: 0, y: 0, w: 12, h: 6 }, // Example layout
          },
        ];
        resolve(dummyTemplates);
      }, 500);
    });
  },

  async loadDashboardTemplate(templateId: string): Promise<Dashboard | null> {
    // Simulate loading a specific template
    return new Promise((resolve) => {
      DashboardService.getDashboardTemplates().then((templates) => {
        const template = templates.find((t) => t.id === templateId);
        setTimeout(() => {
          console.log(`Loading template: ${templateId}`);
          resolve(template || null);
        }, 500);
      });
    });
  },

  // Placeholder method for fetching historical data
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
    // Simulate fetching historical data
    return new Promise((resolve) => {
      setTimeout(() => {
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
        const headers = Object.keys(simulatedHistoricalData[0]); // Extract headers
        const rows = simulatedHistoricalData.map((item) => item); // Keep rows as objects
        resolve({ columns, headers, rows }); // Include headers in the result
      }, 1000);
    });
  },
};

// In-memory storage for refresh intervals and timers
const activeRefreshTimers: Map<string, NodeJS.Timeout> = new Map(); // eslint-disable-line no-undef

// Placeholder function to simulate fetching data for a dashboard's widgets
// In a real application, this would iterate through widgets and use DataConnectorService
const fetchDashboardData = async (dashboardId: string): Promise<void> => {
  console.log(`Fetching data for dashboard: ${dashboardId}`);
  // Simulate data fetching delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // TODO: Integrate formula evaluation here.
  // This would involve:
  // 1. Getting the dashboard configuration (including widgets and their data queries/formulas).
  // 2. Iterating through each widget.
  // 3. For widgets with custom formulas or calculated dimensions:
  //    a. Fetch the necessary base data using DataConnectorService based on the widget's data query.
  //    b. Apply the formula evaluation using the evaluateFormula function from formula-evaluator.ts
  //       to calculate custom metrics or dimensions based on the fetched data.
  //    c. Update the widget's data with the calculated results.
  // 4. For widgets without custom formulas, fetch data directly using DataConnectorService.
  // 5. Update the relevant parts of the application state with the processed data for all widgets.

  console.log(`Data fetched and processed for dashboard: ${dashboardId}`);
  // In a real application, you would update the relevant parts of the application state with the processed data
};

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

    const intervalId = setInterval(() => {
      fetchDashboardData(dashboardId).catch((error: unknown) => {
        console.error(
          `Error refreshing data for dashboard ${dashboardId}:`,
          error,
        );
        // Implement error handling (e.g., notify user)
      });
    }, intervalSeconds * 1000); // Convert seconds to milliseconds

    activeRefreshTimers.set(dashboardId, intervalId);
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
