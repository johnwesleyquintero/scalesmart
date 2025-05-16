export interface CsvTransformerFieldConfig {
  id: string;
  transform?: (value: unknown) => unknown;
  required?: boolean;
  label: string;
}

export type CsvTransformerConfig = CsvTransformerFieldConfig[];
