export const WIDGET_TYPES = {
  CHART: 'chart',
  TABLE: 'table',
  KPI: 'kpi',
  TEXT: 'text',
  IMAGE: 'image',
  FILTER: 'filter',
};

export type WidgetType = keyof typeof WIDGET_TYPES;

// Define a type for conditional formatting rules
export interface ConditionalFormattingRule {
  field: string; // The data field the rule applies to
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'contains'
    | 'not-contains'; // Comparison operator
  value: unknown; // The value to compare against
  style: React.CSSProperties; // CSS styles to apply if the rule matches
}

// Define specific types for each widget's data and configuration
export interface BaseWidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  x: number; // Grid position x
  y: number; // Grid position y
  w: number; // Grid width
  h: number; // Grid height
  conditionalFormattingRules?: ConditionalFormattingRule[]; // Optional conditional formatting rules
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
  type: 'CHART';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }[];
  };
  chartType:
    | 'bar'
    | 'line'
    | 'pie'
    | 'geospatial-map'
    | 'network-graph'
    | 'heatmap'
    | 'funnel-chart'; // Added advanced chart types
}

export interface TableWidgetConfig extends BaseWidgetConfig {
  type: 'TABLE';
  data: {
    headers: string[];
    rows: string[][];
  };
}

export interface KpiWidgetConfig extends BaseWidgetConfig {
  type: 'KPI';
  data: {
    value: string | number;
    label: string;
    description?: string;
  };
}

export interface TextWidgetConfig extends BaseWidgetConfig {
  type: 'TEXT';
  data: {
    content: string; // Supports Markdown
  };
}

export interface ImageWidgetConfig extends BaseWidgetConfig {
  type: 'IMAGE';
  data: {
    url: string;
    altText?: string;
  };
}

export interface FilterWidgetConfig extends BaseWidgetConfig {
  type: 'FILTER';
  data: {
    dataSourceId: string; // ID of the data source to filter
    field: string; // Field to filter on
    filterType: 'dropdown' | 'slider' | 'date-range'; // Example filter types
    options?: string[]; // Options for dropdown
  };
}

export type WidgetData =
  | ChartWidgetConfig['data']
  | TableWidgetConfig['data']
  | KpiWidgetConfig['data']
  | TextWidgetConfig['data']
  | ImageWidgetConfig['data']
  | FilterWidgetConfig['data'];

export type WidgetConfig =
  | ChartWidgetConfig
  | TableWidgetConfig
  | KpiWidgetConfig
  | TextWidgetConfig
  | ImageWidgetConfig
  | FilterWidgetConfig;
