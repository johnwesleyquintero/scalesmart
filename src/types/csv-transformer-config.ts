// src/types/csv-transformer-config.ts

/**
 * Defines the configuration for a single field transformation.
 */
export interface CsvTransformerFieldConfig {
  id: string; // Standardized field ID
  label: string; // Display label for the field
  required?: boolean; // Whether the field is required
  transform?: (value: unknown) => unknown; // Optional transformation function
  // Add other potential configuration properties as needed
}

/**
 * Defines the overall configuration for the CSV transformer.
 * It's an array of field configurations.
 */
export type CsvTransformerConfig = CsvTransformerFieldConfig[];
