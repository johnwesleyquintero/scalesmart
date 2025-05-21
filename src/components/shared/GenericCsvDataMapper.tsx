// c:\\Users\\johnw\\portfolio\\src\\components\\shared\\GenericCsvDataMapper.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
import { Loader2 } from 'lucide-react';
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
  onApplyMapping?: (mapping: CsvColumnMapping) => void; // Make prop optional
  initialMapping?: CsvColumnMapping;
  isLoading?: boolean; // This prop is for parent indicating CSV data is loading
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
  onApplyMapping, // No default, will be undefined if not passed or explicitly set to undefined
  initialMapping = DEFAULT_INITIAL_MAPPING, // Use the stable default
  isLoading = false, // Prop for CSV header loading state
  onCancel,
  sampleDataRow,
  title,
  description,
  toolName, // Destructure toolName
}) => {
  const [currentMapping, setCurrentMapping] = useState<CsvColumnMapping | null>(
    null,
  );
  const [isMappingConfigLoading, setIsMappingConfigLoading] =
    useState<boolean>(true); // For loading mapping from DB
  const [previewData, setPreviewData] = useState<
    Record<string, string>[] | null
  >(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Effect to load saved mapping from IndexedDB or initialize from props
  useEffect(() => {
    const loadMapping = async () => {
      setIsMappingConfigLoading(true);
      let loadedDbMapping: CsvColumnMapping | undefined;

      if (toolName) {
        try {
          const savedRecord = await db.userCsvMappings
            .where('toolName')
            .equals(toolName)
            .last();

          if (savedRecord?.mapping) {
            loadedDbMapping = savedRecord.mapping;
            console.log(
              `Loaded mapping from IndexedDB for ${toolName}:`,
              loadedDbMapping,
            );
          }
        } catch (error) {
          console.error(
            `Error loading mapping from IndexedDB for ${toolName}:`,
            error,
          );
          toast.error(
            `Error loading saved mapping for ${toolName}. Using defaults.`,
          );
          // Proceed without a saved mapping, will use initialMapping or defaults
        }
      }

      const newMapping: CsvColumnMapping = {};
      targetMetrics.forEach((metric) => {
        // Priority: 1. Loaded DB mapping, 2. initialMapping prop, 3. null
        if (loadedDbMapping && loadedDbMapping[metric.key] !== undefined) {
          newMapping[metric.key] = loadedDbMapping[metric.key];
        } else if (initialMapping[metric.key] !== undefined) {
          newMapping[metric.key] = initialMapping[metric.key];
        } else {
          newMapping[metric.key] = null;
        }
      });

      if (!loadedDbMapping) {
        console.log(
          `No saved mapping found for ${toolName || 'current tool'} (or toolName not provided). Initialized from props/defaults.`,
          newMapping,
        );
      }

      setCurrentMapping(newMapping);
      setIsMappingConfigLoading(false);
    };

    loadMapping();
  }, [toolName, targetMetrics, initialMapping, db.userCsvMappings]); // Rerun if these key identifiers change

  const handleSelectChange = (
    targetFieldId: keyof DashboardMetrics,
    csvHeader: string,
  ) => {
    setCurrentMapping((prev) => ({
      ...prev,
      [targetFieldId]: csvHeader === 'none' ? null : csvHeader,
    }));
  };

  const handleApplyAndSavePrefs = async () => {
    if (!currentMapping || !validateMapping()) {
      toast.error('Please fix mapping errors before applying.');
      return;
    }

    setIsSaving(true);

    // Save to IndexedDB
    if (toolName) {
      try {
        // Using put for simplicity (upsert)
        await db.userCsvMappings.put({
          toolName,
          mapping: currentMapping,
          timestamp: new Date(), // Keep timestamp if your schema uses it
        });
        console.log(
          `Mapping preferences saved to DB for ${toolName}:`,
          currentMapping,
        );
        toast.success('Mapping preferences saved!');
      } catch (error) {
        console.error(
          `Error saving mapping preferences to DB for ${toolName}:`,
          error,
        );
        toast.error('Failed to save mapping preferences.');
      }
    }

    if (typeof onApplyMapping === 'function') {
      onApplyMapping(currentMapping); // Call the parent's callback
    } else {
      // Handle cases where onApplyMapping is not a function
      if (onApplyMapping === undefined) {
        // This is the new "fallback" behavior if the prop is omitted or explicitly undefined
        console.info(
          "GenericCsvDataMapper: 'onApplyMapping' callback was not provided or was undefined. " +
            'Mapping preferences have been saved, but the mapping was not applied to the parent component.',
        );
        toast.info(
          'Mapping preferences saved. To apply changes externally, ensure the integration is correctly configured.',
        );
      } else {
        // This case handles if onApplyMapping is something else (null, number, string etc.) which is a true type error
        console.error(
          "GenericCsvDataMapper Error: Invalid 'onApplyMapping' prop. Expected a function but received:",
          typeof onApplyMapping,
          onApplyMapping,
        );
        toast.error(
          'Configuration error: Cannot apply mapping due to an invalid callback. Please contact support.',
        );
      }
    }
    setIsSaving(false);
  };

  const handleResetMapping = useCallback(() => {
    if (targetMetrics.length === 0) {
      setCurrentMapping({});
      toast.info('Mapping reset (no target metrics).');
      return;
    }

    const newMapping: CsvColumnMapping = {};
    targetMetrics.forEach((metric) => {
      // Use initialMapping from props (which defaults to DEFAULT_INITIAL_MAPPING)
      if (initialMapping[metric.key] !== undefined) {
        newMapping[metric.key] = initialMapping[metric.key];
      } else {
        newMapping[metric.key] = null;
      }
    });
    setCurrentMapping(newMapping);
    setValidationErrors([]); // Clear any previous validation errors
    toast.info('Mapping has been reset to defaults.');
  }, [targetMetrics, initialMapping, setCurrentMapping, setValidationErrors]);

  const validateMapping = () => {
    const errors: string[] = [];
    if (!currentMapping) {
      // Should not happen if initialized correctly
      errors.push('Mapping is not initialized.');
      setValidationErrors(errors);
      return false;
    }
    for (const field of targetMetrics) {
      if (field.required && !currentMapping[field.key]) {
        errors.push(`Please map the required field: ${field.label}`);
      }
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    if (csvHeaders && sampleDataRow) {
      // If sampleDataRow is provided, use it as the single row for preview
      setPreviewData([sampleDataRow]);
    } else {
      // Clear preview if no sampleDataRow or csvHeaders
      setPreviewData(null);
    }
  }, [csvHeaders, sampleDataRow]);

  if (isLoading) {
    return <div className={styles.loading}>Loading CSV headers...</div>;
  }

  if (isMappingConfigLoading) {
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

  const handleDownloadSampleCsv = (fileName: string) => {
    // Assumes sample CSVs are in the public/samples directory.
    // Adjust the path according to your project structure.
    const filePath = `/samples/${fileName}`;

    const link = document.createElement('a');
    link.href = filePath;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to determine the sample CSV filename based on the toolName
  const getActualSampleCsvFileName = (
    currentToolName: string,
  ): string | null => {
    switch (currentToolName) {
      case 'keyword-analyzer':
        return 'keyword_list_sample.csv';
      case 'fba-calculator':
        return 'fba_fees_sample.csv';
      case 'ppc-campaign-auditor':
        return 'ppc_campaign_report_sample.csv';
      case 'amazon-overview-dashboard': // From previous request
        return 'amazon_overview_dashboard_template.csv';
      default:
        return null; // No specific template for other tools
    }
  };

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
            <h4 className={styles.previewTitle}>
              CSV Row Preview (Using First Data Row)
            </h4>
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
          <Button
            onClick={handleApplyAndSavePrefs}
            className={styles.submitButton}
            disabled={
              isSaving ||
              isMappingConfigLoading ||
              (targetMetrics.length > 0 &&
                (!currentMapping ||
                  Object.values(currentMapping).every((val) => val === null)))
            }
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Mapping
          </Button>
          <Button
            onClick={handleResetMapping}
            variant="outline"
            className={styles.resetButton} // Add a class if you want specific styling
            disabled={isSaving || isMappingConfigLoading}
          >
            Reset
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className={styles.cancelButton}
            disabled={isSaving || isMappingConfigLoading}
          >
            Cancel
          </Button>
          {(() => {
            const actualSampleFileName = getActualSampleCsvFileName(toolName);
            if (actualSampleFileName) {
              return (
                <SampleCsvButton
                  fileName={actualSampleFileName}
                  onClick={handleDownloadSampleCsv}
                  buttonText={`Download Template for ${toolName}`}
                />
              );
            }
            return null;
          })()}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default GenericCsvDataMapper;
