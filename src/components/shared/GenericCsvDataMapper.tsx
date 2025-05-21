// c:\\Users\\johnw\\portfolio\\src\\components\\shared\\GenericCsvDataMapper.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { CsvColumnMapping } from '@/types/data-mapping';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import styles from './GenericCsvDataMapper.module.css';
import SampleCsvButton from './sample-csv-button';
import { db } from '@/lib/indexeddb/amazon-tools-db'; // Import the IndexedDB instance

interface GenericCsvDataMapperProps {
  csvHeaders: string[];
  targetMetrics: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  }[];
  onMappingComplete: (mapping: CsvColumnMapping) => void;
  initialMapping?: CsvColumnMapping;
  isLoading?: boolean;
  onCancel: () => void;
  sampleDataRow?: Record<string, string>; // To show sample values
  title: string;
  description: string;
  toolName: string; // Add toolName prop
}

// Define a stable empty object for the default initialMapping
const DEFAULT_INITIAL_MAPPING: CsvColumnMapping = Object.freeze({}); // Make it immutable too

const GenericCsvDataMapper: React.FC<GenericCsvDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onMappingComplete,
  initialMapping = DEFAULT_INITIAL_MAPPING, // Use the stable default
  isLoading = false,
  onCancel,
  sampleDataRow,
  title,
  description,
  toolName, // Destructure toolName
}) => {
  const [currentMapping, setCurrentMapping] = useState<CsvColumnMapping | null>(
    null,
  );
  const [isMappingLoading, setIsMappingLoading] = useState<boolean>(true);
  const [previewData, setPreviewData] = useState<
    Record<string, string>[] | null
  >(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Effect to load saved mapping from IndexedDB or initialize from props
  useEffect(() => {
    const loadMapping = async () => {
      setIsMappingLoading(true);
      let finalMapping: CsvColumnMapping = {};

      if (toolName) {
        try {
          const savedRecord = await db.userCsvMappings
            .where('toolName')
            .equals(toolName)
            .last(); // Get the most recent mapping for this tool

          if (savedRecord && savedRecord.mapping) {
            finalMapping = savedRecord.mapping;
            console.log(
              `Loaded mapping from IndexedDB for ${toolName}:`,
              finalMapping,
            );
          } else {
            // No saved mapping, construct from initialMapping prop or default
            targetMetrics.forEach((field) => {
              finalMapping[field.key] = initialMapping[field.key] || null;
            });
            console.log(
              `No saved mapping for ${toolName}, using initial/default:`,
              finalMapping,
            );
          }
        } catch (error) {
          console.error(
            `Error loading mapping from IndexedDB for ${toolName}:`,
            error,
          );
          // Fallback to initialMapping on error
          targetMetrics.forEach((field) => {
            finalMapping[field.key] = initialMapping[field.key] || null;
          });
        }
      } else {
        // No toolName, construct from initialMapping prop or default
        targetMetrics.forEach((field) => {
          finalMapping[field.key] = initialMapping[field.key] || null;
        });
        console.log(
          'No toolName provided, using initial/default mapping:',
          finalMapping,
        );
      }

      // Ensure all targetMetric keys are present in the finalMapping,
      // especially if targetMetrics changed since last save.
      const completeFinalMapping: CsvColumnMapping = {};
      targetMetrics.forEach((field) => {
        completeFinalMapping[field.key] =
          finalMapping[field.key] !== undefined
            ? finalMapping[field.key]
            : null;
      });

      setCurrentMapping(completeFinalMapping);
      setIsMappingLoading(false);
    };

    loadMapping();
  }, [toolName, targetMetrics, initialMapping]); // Rerun if these key identifiers change

  const handleSelectChange = (
    targetFieldId: keyof DashboardMetrics,
    csvHeader: string,
  ) => {
    setCurrentMapping((prev) => ({
      ...prev,
      [targetFieldId]: csvHeader === 'none' ? null : csvHeader,
    }));
  };

  const handleSubmit = async () => {
    // Validation moved to a separate function
    if (!currentMapping || !validateMapping()) {
      return;
    }

    // Save to IndexedDB
    if (toolName) {
      try {
        const existingRecord = await db.userCsvMappings
          .where('toolName')
          .equals(toolName)
          .first();

        if (existingRecord && typeof existingRecord.id === 'number') {
          await db.userCsvMappings.update(existingRecord.id, {
            mapping: currentMapping,
            timestamp: new Date(),
          });
          console.log(`Updated mapping in IndexedDB for ${toolName}`);
        } else {
          await db.userCsvMappings.add({
            toolName,
            mapping: currentMapping,
            timestamp: new Date(),
          });
          console.log(`Added new mapping to IndexedDB for ${toolName}`);
        }
      } catch (error) {
        console.error(
          `Error saving mapping to IndexedDB for ${toolName}:`,
          error,
        );
      }
    }
    onMappingComplete(currentMapping);
  };

  const validateMapping = () => {
    const errors: string[] = [];
    for (const field of targetMetrics) {
      if (field.required && (!currentMapping || !currentMapping[field.key])) {
        errors.push(`Please map the required field: ${field.label}`);
      }
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    if (csvHeaders && sampleDataRow) {
      // Basic preview generation
      const preview: Record<string, string>[] = [];
      for (let i = 0; i < 3 && sampleDataRow; i++) {
        // Show first 3 rows
        preview.push(sampleDataRow);
      }
      setPreviewData(preview);
    }
  }, [csvHeaders, sampleDataRow]);

  if (isLoading) {
    return <div className={styles.loading}>Loading CSV headers...</div>;
  }

  if (isMappingLoading) {
    return (
      <div className={styles.loading}>Loading mapping configuration...</div>
    );
  }
  if (!currentMapping) {
    return (
      <div className={styles.noHeaders}>
        Error initializing mapping. Please try again.
      </div>
    );
  }

  if (!csvHeaders || csvHeaders.length === 0) {
    return (
      <div className={styles.noHeaders}>
        No CSV headers found. Please upload a valid CSV.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={styles.mapperContainer}>
        <h3 className={styles.title}>{title}</h3>
        <p>{description}</p>
        {validationErrors.length > 0 && (
          <div className={styles.validationErrors}>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index} className={styles.validationErrorItem}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={styles.mappingTable}>
          <div className={`${styles.mappingRow} ${styles.mappingHeaderRow}`}>
            <div className={styles.targetMetricHeader}>Dashboard Field</div>
            <div className={styles.expectedTypeHeader}>Expected Type</div>
            <div className={styles.csvColumnHeader}>CSV Column to Map</div>
            <div className={styles.sampleValueHeader}>
              Sample Value (from your CSV)
            </div>
          </div>
          {targetMetrics.map((field) => (
            <div key={field.key} className={styles.mappingRow}>
              <div className={styles.targetMetricCell}>
                <Label
                  htmlFor={'select-' + String(field.key)}
                  className={styles.label}
                >
                  {field.label}
                  {field.required && <span className={styles.required}>*</span>}
                </Label>
                {field.hint && (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className={styles.hint}>?</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{field.hint}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className={styles.expectedTypeCell}>
                <span className={styles.typeBadge}>{field.expectedType}</span>
              </div>
              <div className={styles.csvColumnCell}>
                <Select
                  value={(currentMapping?.[field.key] as string) || 'none'}
                  onValueChange={(value) =>
                    handleSelectChange(field.key, value)
                  }
                >
                  <SelectTrigger
                    id={'select-' + String(field.key)}
                    className={`${styles.selectTrigger} ${
                      validationErrors.some((error) =>
                        error.includes(field.label),
                      )
                        ? styles.selectError
                        : ''
                    }`}
                  >
                    <SelectValue placeholder="Select CSV Column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not Mapped --</SelectItem>
                    {csvHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.some((error) =>
                  error.includes(field.label),
                ) && (
                  <p className={styles.errorText}>
                    Please map this required field.
                  </p>
                )}
              </div>
              <div className={styles.sampleValueCell}>
                {sampleDataRow &&
                currentMapping?.[field.key] &&
                sampleDataRow[currentMapping[field.key] as string] ? (
                  <span className={styles.sampleText}>
                    {sampleDataRow[currentMapping[field.key] as string]}
                  </span>
                ) : (
                  <span className={styles.noSampleText}>N/A</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {previewData && (
          <div className={styles.previewContainer}>
            <h4 className={styles.previewTitle}>CSV Preview (First 3 Rows)</h4>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  {csvHeaders.map((header) => (
                    <th key={header} className={styles.previewHeader}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={styles.previewRow}>
                    {csvHeaders.map((header) => (
                      <td key={header} className={styles.previewCell}>
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.actionButtons}>
          <Button onClick={handleSubmit} className={styles.submitButton}>
            Confirm Mapping
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          {toolName && (
            <SampleCsvButton toolName={toolName} onClick={() => {}} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default GenericCsvDataMapper;
