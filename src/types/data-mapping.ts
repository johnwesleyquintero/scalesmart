// src/types/data-mapping.ts

/**
 * Defines the mapping from standardized field IDs to raw CSV column headers.
 */
export type CsvColumnMapping = {
  [key: string]: string | undefined;
};

/**
 * Defines the transformation rules for a single column.
 */
export interface ColumnTransformationRules {
  trim?: boolean;
  case?: 'none' | 'upper' | 'lower' | 'title';
  findReplace?: { find: string; replace: string }[];
  // Add other potential transformation rules as needed
}
