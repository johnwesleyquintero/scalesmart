// c:\\Users\\johnw\\portfolio\\src\\components\\shared\\GenericCsvDataMapper.tsx
'use client';

import fuzzysort from 'fuzzysort';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import type { CsvColumnMapping } from '@/types/data-mapping';
import stringSimilarity from 'string-similarity';
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
import { Loader2, Edit2 } from 'lucide-react'; // Import Edit2 icon
import { Button } from '@/components/ui/button';
import styles from './GenericCsvDataMapper.module.css';
import SampleCsvButton from './sample-csv-button';
import { db } from '@/lib/indexeddb/amazon-tools-db'; // Import the IndexedDB instance
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // DialogClose, // We can use a button with onOpenChange
} from '@/components/ui/dialog'; // Import Dialog components

interface GenericCsvDataMapperProps {
  csvHeaders: string[];
  targetMetrics: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  }[];
  userCsvSynonyms?: { [key: string]: string[] }; // Add userCsvSynonyms prop
  onApplyMapping?: (mapping: CsvColumnMapping) => void; // Make prop optional
  initialMapping?: CsvColumnMapping;
  isLoading?: boolean; // This prop is for parent indicating CSV data is loading
  onCancel: () => void;
  sampleDataRow?: Record<string, string>; // To show sample values
  title: string;
  description: string;
  toolName: string; // Add toolName prop
  toolId?: string;
  transformations?: {
    trim?: boolean;
    case?: 'upper' | 'lower' | 'title';
    findReplace?: { find: string; replace: string }[];
  };
}

const calculateSimilarity = (
  header: string,
  targetLabel: string,
  userSynonyms: { [key: string]: string[] } = {},
): number => {
  const headerLower = header.toLowerCase();
  const targetLabelLower = targetLabel.toLowerCase();
  let baseSimilarity = stringSimilarity.compareTwoStrings(
    headerLower,
    targetLabelLower,
  );

  // Check for synonyms
  const synonymsForTarget = userSynonyms[targetLabel];
  if (synonymsForTarget && synonymsForTarget.length > 0) {
    for (const synonym of synonymsForTarget) {
      const synonymLower = synonym.toLowerCase();
      const synonymSimilarity = stringSimilarity.compareTwoStrings(
        headerLower,
        synonymLower,
      );
      if (synonymSimilarity > baseSimilarity) {
        baseSimilarity = synonymSimilarity; // Prioritize synonym matches
      }
    }
  }

  return baseSimilarity;
};

// Define a stable empty object for the default initialMapping
const DEFAULT_INITIAL_MAPPING: CsvColumnMapping = Object.freeze({
  date: null,
  unique_identifier: null,
  total_sales: null,
  total_orders: null,
  total_sessions: null,
  total_conversion_rate: null,
  ad_impressions: null,
  ad_clicks: null,
  ad_spend: null,
  ad_sales: null,
  ad_orders: null,
  acos: null,
  roas: null,
  cpc: null,
  ctr: null,
  ad_conversion_rate: null,
  profit: null,
  inventory_level: null,
  review_rating: null,
  cac: null,
  ltv: null,
  asin: null,
  keyword: null,
  targeted_keyword: null,
}); // Make it immutable too

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
  toolId,
  userCsvSynonyms,
  transformations,
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
  const [synonyms, setSynonyms] = useState<{ [key: string]: string[] }>(
    userCsvSynonyms || {},
  );
  // State for the transformation configuration modal
  const [isTransformModalOpen, setIsTransformModalOpen] =
    useState<boolean>(false);
  const [currentTransformField, setCurrentTransformField] = useState<{
    key: keyof DashboardMetrics;
    label: string;
  } | null>(null);

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

      const newMapping: CsvColumnMapping = {
        date: null,
        unique_identifier: null,
        total_sales: null,
        total_orders: null,
        total_sessions: null,
        total_conversion_rate: null,
        ad_impressions: null,
        ad_clicks: null,
        ad_spend: null,
        ad_sales: null,
        ad_orders: null,
        acos: null,
        roas: null,
        cpc: null,
        ctr: null,
        ad_conversion_rate: null,
        profit: null,
        inventory_level: null,
        review_rating: null,
        cac: null,
        ltv: null,
        asin: null,
        keyword: null,
        targeted_keyword: null,
      };
      targetMetrics.forEach((metric) => {
        // Priority: 1. Loaded DB mapping, 2. initialMapping prop
        if (
          loadedDbMapping &&
          loadedDbMapping[metric.key as keyof CsvColumnMapping] !== undefined
        ) {
          newMapping[metric.key as keyof CsvColumnMapping] =
            loadedDbMapping[metric.key as keyof CsvColumnMapping];
        } else if (
          initialMapping &&
          initialMapping[metric.key as keyof CsvColumnMapping] !== undefined
        ) {
          newMapping[metric.key as keyof CsvColumnMapping] =
            initialMapping[metric.key as keyof CsvColumnMapping];
        } else {
          newMapping[metric.key as keyof CsvColumnMapping] = null;
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
  }, [
    toolName,
    targetMetrics,
    initialMapping,
    db.userCsvMappings,
    userCsvSynonyms,
  ]); // Rerun if these key identifiers change

  const handleSelectChange = (
    targetFieldId: keyof DashboardMetrics,
    csvHeader: string,
  ) => {
    setCurrentMapping((prev) => {
      const newMapping = { ...prev } as CsvColumnMapping;
      newMapping[targetFieldId as keyof CsvColumnMapping] =
        csvHeader === 'none' ? null : csvHeader;
      return newMapping;
    });
  };

  const applyTransformations = (
    value: string,
    transformations?: {
      trim?: boolean;
      case?: 'upper' | 'lower' | 'title';
      findReplace?: { find: string; replace: string }[];
    },
  ): string => {
    let transformedValue = value;

    if (transformations) {
      if (transformations.trim) {
        transformedValue = transformedValue.trim();
      }
      if (transformations.case) {
        switch (transformations.case) {
          case 'upper':
            transformedValue = transformedValue.toUpperCase();
            break;
          case 'lower':
            transformedValue = transformedValue.toLowerCase();
            break;
          case 'title':
            transformedValue = transformedValue.replace(
              /\w\S*/g,
              (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
            );
            break;
        }
      }
      if (transformations.findReplace) {
        for (const rule of transformations.findReplace) {
          transformedValue = transformedValue.replace(
            new RegExp(rule.find, 'g'),
            rule.replace,
          );
        }
      }
    }

    return transformedValue;
  };

  const validateValue = (
    value: string,
    expectedType: string,
    label: string,
    errors: string[],
    header: string | null | undefined,
    transformations?: {
      trim?: boolean;
      case?: 'upper' | 'lower' | 'title';
      findReplace?: { find: string; replace: string }[];
    },
  ) => {
    if (!header) {
      errors.push(`The field "${label}" is not mapped to any CSV column.`);
      return;
    }

    const transformedValue = applyTransformations(value, transformations);

    switch (expectedType) {
      case 'number':
        if (!isValidNumber(transformedValue)) {
          errors.push(
            `The field "${label}" (column "${header}") should be a number. The value "${value}" is not a valid number.`,
          );
        }
        break;
      case 'date':
        if (!isValidDate(transformedValue)) {
          errors.push(
            `The field "${label}" (column "${header}") should be a date. The value "${value}" is not a valid date.`,
          );
        }
        break;
      case 'boolean':
        if (!isValidBoolean(transformedValue)) {
          errors.push(
            `The field "${label}" (column "${header}") should be a boolean. The value "${value}" is not a valid boolean.`,
          );
        }
        break;
      // string type doesn't need validation
    }
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
      setCurrentMapping(null);
      toast.info('Mapping reset (no target metrics).');
      return;
    }

    const newMapping: CsvColumnMapping = { ...DEFAULT_INITIAL_MAPPING };
    targetMetrics.forEach((metric) => {
      // Use initialMapping from props (which defaults to DEFAULT_INITIAL_MAPPING)
      if (initialMapping[metric.key as keyof CsvColumnMapping] !== undefined) {
        newMapping[metric.key] = initialMapping[metric.key];
      } else {
        newMapping[metric.key] = null;
      }
    });
    setCurrentMapping(newMapping);
    setValidationErrors([]); // Clear any previous validation errors
    toast.info('Mapping has been reset to defaults.');
  }, [targetMetrics, initialMapping, setCurrentMapping, setValidationErrors]);

  const isValidNumber = (value: string): boolean => {
    return !isNaN(Number(value));
  };

  const isValidDate = (value: string): boolean => {
    return !isNaN(new Date(value).getTime());
  };

  const isValidBoolean = (value: string): boolean => {
    const lowerCaseValue = value.toLowerCase();
    return lowerCaseValue === 'true' || lowerCaseValue === 'false';
  };

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
      } else if (currentMapping[field.key] && sampleDataRow) {
        const mappedValue = sampleDataRow[currentMapping[field.key] as string];
        if (mappedValue) {
          validateValue(
            mappedValue,
            field.expectedType,
            field.label,
            errors,
            currentMapping[field.key] as string | null | undefined,
            transformations,
          );
        }
      }
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    if (csvHeaders && sampleDataRow) {
      // If sampleDataRow is provided, use it as the first row for preview
      setPreviewData([sampleDataRow]);
    } else {
      // Clear preview if no sampleDataRow or csvHeaders
      setPreviewData(null);
    }
  }, [csvHeaders, sampleDataRow, currentMapping, transformations, synonyms]);

  useEffect(() => {
    if (csvHeaders && sampleDataRow) {
      // Assuming you have access to the full CSV data here (e.g., from a prop)
      // For demonstration, let's create a sample of 10 rows based on the headers and sampleDataRow
      const previewRows = [];
      for (let i = 0; i < 10; i++) {
        const rowData: Record<string, string> = {};
        csvHeaders.forEach((header) => {
          rowData[header] = sampleDataRow[header] || ''; // Use sampleDataRow values or empty string
        });
        previewRows.push(rowData);
      }
      setPreviewData(previewRows);
    } else {
      setPreviewData(null);
    }
  }, [csvHeaders, sampleDataRow, currentMapping, transformations, synonyms]);

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
    console.log('Attempting to download sample CSV from:', filePath); // Log the file path

    const link = document.createElement('a');
    link.href = filePath;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Sample CSV download initiated successfully.'); // Log success
  };

  // Function to determine the sample CSV filename based on the toolName
  const getActualSampleCsvFileName = (
    currentToolName: string,
  ): string | null => {
    console.log(
      'getActualSampleCsvFileName called with toolName:',
      currentToolName,
    ); // Log the toolName
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

  const getSuggestedCsvFields = (targetMetric: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  }) => {
    const targetMetricKey =
      typeof targetMetric.key === 'string'
        ? targetMetric.key.toLowerCase()
        : '';
    const results = fuzzysort.go(targetMetricKey, csvHeaders, {
      key: (header: string) => header.toLowerCase(),
      limit: 5, // Limit to top 5 results
    });
    return results.map((result) => result.obj);
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
                  value={
                    (currentMapping?.[
                      field.key as keyof CsvColumnMapping
                    ] as string) || 'none'
                  }
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
                    {csvHeaders.map((header) => {
                      const similarity = calculateSimilarity(
                        header,
                        field.label,
                        synonyms, // Use the synonyms prop
                      );
                      const confidence = (similarity * 100).toFixed(0);
                      return (
                        <SelectItem key={header} value={header}>
                          {header}{' '}
                          {similarity > 0 && (
                            <span className={styles.confidence}>
                              ({confidence}%)
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className={styles.transformButton}
                  onClick={() => {
                    setCurrentTransformField({
                      key: field.key,
                      label: field.label,
                    });
                    setIsTransformModalOpen(true);
                  }}
                  aria-label={`Configure transformations for ${field.label}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
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
                    <th key={header} className={styles.previewHeaderCell}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={styles.previewRow}>
                    {csvHeaders.map((header) => (
                      <td key={header} className={styles.previewDataCell}>
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
        </div>
        {/* Transformation Configuration Modal */}
        <Dialog
          open={isTransformModalOpen}
          onOpenChange={setIsTransformModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Configure Transformations for "{currentTransformField?.label}"
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Transformation settings UI (e.g., trim, case change,
                find/replace) for the "{currentTransformField?.label}" field
                will be implemented here.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTransformModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default GenericCsvDataMapper;
