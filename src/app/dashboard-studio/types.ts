export interface Widget {
  id: string;
  type: 'chart' | 'table' | 'text';
  title: string;
  data: any;
  // Add other common widget properties
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  layout: any; // Consider a more specific type for layout, e.g., GridsterLayout
}

export interface DataSourceConfig {
  type: string; // e.g., 'database', 'api', 'spreadsheet'
  connectionString: string; // Connection details
  // Add other data source specific properties
}
