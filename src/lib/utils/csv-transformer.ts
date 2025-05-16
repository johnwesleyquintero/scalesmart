// c:\Users\johnw\portfolio\src\lib\utils\csv-transformer.ts

import { CsvColumnMapping } from '@/types/data-mapping';
import {
  CsvTransformerConfig,
  CsvTransformerFieldConfig,
} from '@/types/csv-transformer-config';

/**
 * Transforms raw CSV data (array of objects where keys are CSV headers)
 * into an array of standardized objects based on the provided mapping and config.
 *
 * @param rawData Raw data from PapaParse (or similar), array of objects.
 * @param mapping The CsvColumnMapping object from GenericCsvDataMapper.
 * @param mappingConfig The ToolMappingConfig for the specific tool.
 * @returns An array of standardized data objects.
 */
export function transformCsvData<T extends Record<string, unknown>>(
  rawData: Record<string, unknown>[],
  mapping: CsvColumnMapping,
  mappingConfig: CsvTransformerConfig,
): T[] {
  return rawData
    .map((row) => {
      const standardizedRow: Partial<T> = {};
      mappingConfig.forEach((fieldConfig: CsvTransformerFieldConfig) => {
        const csvHeader = mapping[fieldConfig.id];
        if (csvHeader && Object.prototype.hasOwnProperty.call(row, csvHeader)) {
          let value = row[csvHeader];
          if (fieldConfig.transform) {
            value = fieldConfig.transform(value);
          }
          // Basic type coercion can be added here based on fieldConfig if needed
          // e.g., if (fieldConfig.type === 'number') value = parseFloat(value) || 0;
          standardizedRow[fieldConfig.id as keyof T] = value as T[keyof T];
        } else if (fieldConfig.required) {
          // Handle missing required data, perhaps throw an error or set a default
          // For now, we'll let it be undefined and rely on later validation
          console.warn(
            `Required field "${fieldConfig.label}" (ID: ${fieldConfig.id}) not found or not mapped for a row.`,
          );
        }
      });
      return standardizedRow as T;
    })
    .filter((row) => Object.keys(row).length > 0); // Filter out potentially empty rows if all optional fields were unmapped
}
