import { WidgetConfig } from './widget-types';
import { Layout } from 'react-grid-layout';

export interface Dashboard {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout: Layout;
}

export interface DataSourceConfig {
  id: string; // Add ID for data source
  name: string; // Add name for data source
  type: string; // e.g., 'database', 'api', 'spreadsheet'
  connectionString: string; // Connection details (consider making this more secure/abstract)
  // Add other data source specific properties
}
