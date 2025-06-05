'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { toast } from 'sonner';
import type {
  CsvColumnMapping,
  ColumnTransformationRules,
} from 'types/data-mapping';
import stringSimilarity from 'string-similarity';
import type { DashboardMetrics } from 'lib/amazon-tools/types';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from 'components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { Label } from 'components/ui/label';
import { Loader2, Edit2 } from 'lucide-react';
import { Button } from 'components/ui/button';
import styles from './GenericCsvDataMapper.module.css';
import TransformationModalContent from './TransformationModalContent';

import { db } from 'lib/indexeddb/amazon-tools-db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'components/ui/dialog';

// Define a constant for the unmapped value string used in the Select component
const UNMAPPED_SELECT_VALUE = 'none';
// Define the minimum similarity threshold to suggest a column match
const SIMILARITY_THRESHOLD = 0.2;

// Define a stable empty object structure for the default initialMapping.
// It must contain all possible keys from DashboardMetrics initialized to null
// to satisfy the CsvColumnMapping type structure. Use Object.freeze for stability.
// This structure is critical for initializing state and ensuring type consistency,
// especially when merging with loaded data from DB or props.
// It ensures that that the mapping state and DB record schema are complete.
// TODO: If DashboardMetrics can be dynamically introspected (e.g., from a Zod schema),
// this could be generated automatically to ensure it always matches the latest type definition.
// This is a potential future enhancement outside the scope of this refactor.
const DEFAULT_INITIAL_MAPPING: CsvColumnMapping = Object.freeze(
  {
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
    // Ensure all keys from DashboardMetrics are present here, initialized to null.
  } as CsvColumnMapping, // Cast to ensure type correctness
);

// --- Helper Functions (Moved outside component for clarity) ---

/**
 * Calculates the similarity between a header string and a target label,
 * considering optional user-provided synonyms.
 * @param header The CSV header string.
 * @param targetLabel The target metric label (e.g., "Total Sales").
 * @param userSynonyms Optional map of target labels to arrays of synonym strings.
 * @returns A similarity score between 0 and 1.
 */
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

  // Check for synonyms provided via props
  const synonymsForTarget = userSynonyms[targetLabel];
  if (synonymsForTarget && synonymsForTarget.length > 0) {
    for (const synonym of synonymsForTarget) {
      const synonymLower = synonym.toLowerCase();
      const synonymSimilarity = stringSimilarity.compareTwoStrings(
        headerLower,
        synonymLower,
      );
      // Prioritize synonym matches if they are higher
      if (synonymSimilarity > baseSimilarity) {
        baseSimilarity = synonymSimilarity;
      }
    }
  }

  return baseSimilarity;
};

/**
 * Applies a series of find/replace rules to a string value.
 * Uses global regex replacement for all occurrences.
 * @param value The input string value.
 * @param findReplaceRules An array of find/replace rule objects.
 * @returns The transformed string value.
 */
const applyFindReplace = (
  value: string,
  findReplaceRules: { find: string; replace: string }[],
): string => {
  let transformedValue = value;
  for (const rule of findReplaceRules) {
    try {
      // Escape special regex characters in the 'find' string to treat it as a literal string
      // Ensure the global flag 'g' is always used for replaceAll behavior
      const findRegex = new RegExp(
        rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g',
      );
      transformedValue = transformedValue.replace(findRegex, rule.replace);
    } catch (e) {
      console.error('Error applying find/replace regex:', rule, e);
      // Continue with other rules or handle error as needed
    }
  }
  return transformedValue;
};

/**
 * Applies a set of transformation rules (trim, case, find/replace) to a value.
 * Handles null/undefined/empty string input gracefully.
 * @param value The input value (string, null, or undefined).
 * @param transformations Optional transformation rules to apply.
 * @returns The transformed string value. Returns empty string for null/undefined/empty input.
 */
const applyTransformations = (
  value: string | null | undefined,
  transformations?: ColumnTransformationRules,
): string => {
  // Handle null/undefined/empty string gracefully early
  if (value === null || value === undefined || value === '') {
    return ''; // Return empty string for null/undefined/empty input
  }
  let transformedValue = String(value); // Ensure it's a string

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
          transformedValue = transformedValue.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
          });
          break;
      }
    }
    if (transformations.findReplace && transformations.findReplace.length > 0) {
      // Delegate find/replace to a separate helper to reduce complexity here
      transformedValue = applyFindReplace(
        transformedValue,
        transformations.findReplace,
      );
    }
  }

  return transformedValue;
};

// Validation helpers (Kept as is, they are pure and fine)
const isValidNumber = (value: string): boolean => {
  // Use unary plus for type conversion and check for NaN and Infinity
  return value !== '' && !isNaN(+value) && isFinite(+value);
};

const isValidDate = (value: string): boolean => {
  if (value === '') return false;
  const date = new Date(value);
  // Check if parsing resulted in a valid Date object
  return !isNaN(date.getTime());
};

const isValidBoolean = (value: string): boolean => {
  const lowerCaseValue = value.toLowerCase().trim();
  // Add common boolean representations if needed (e.g., 1/0, yes/no)
  return lowerCaseValue === 'true' || lowerCaseValue === 'false';
};

/**
 * Validates a single value against its expected type after applying transformations.
 * Returns an error message string or null if valid.
 * @param value The original sample value string.
 * @param expectedType The expected data type ('string', 'number', 'date', 'boolean').
 * @param label The label of the target metric field.
 * @param header The CSV header string the value came from.
 * @param appliedTransformations Optional transformation rules applied to the value.
 * @returns An error message string or null.
 */
const validateValue = (
  value: string,
  expectedType: string,
  label: string,
  header: string,
  appliedTransformations?: ColumnTransformationRules,
): string | null => {
  const transformedValue = applyTransformations(value, appliedTransformations);

  // If transformedValue is empty after trimming/transforming, it's invalid for non-string types (or required strings)
  // However, required check is done elsewhere. Here, we only check format if value is not empty.
  if (transformedValue === '' && expectedType !== 'string') {
    // For non-string types, an empty transformed value is invalid data.
    // The 'required' check for mapping existence is handled in validateFieldMapping.
    // This check ensures that *if* a column is mapped for a non-string type, the sample data is not empty after transformations.
    // Let's refine: The core `required` check is for the *mapping*. If mapped, we validate the *value*.
    // If the value transforms to empty, it *is* an invalid value for number/date/boolean.
    return `"${label}" expects a ${expectedType}. Value "${value}" (transformed: "${transformedValue}") from column "${header}" is empty after transformations.`;
  }

  switch (expectedType) {
    case 'number':
      if (!isValidNumber(transformedValue)) {
        // Show original value in error message for context
        return `"${label}" expects a number. Value "${value}" (transformed: "${transformedValue}") from column "${header}" is invalid.`;
      }
      break;
    case 'date':
      if (!isValidDate(transformedValue)) {
        return `"${label}" expects a date. Value "${value}" (transformed: "${transformedValue}") from column "${header}" is invalid.`;
      }
      break;
    case 'boolean':
      if (!isValidBoolean(transformedValue)) {
        return `"${label}" expects a boolean (true/false). Value "${value}" (transformed: "${transformedValue}") from column "${header}" is invalid.`;
      }
      break;
    // 'string' type does not require specific format validation, only presence if required
    // Empty string is a valid string value
  }
  return null; // No error
};

/**
 * Validates a single field's mapping and the corresponding sample value.
 * Checks for required fields being unmapped and mapped values matching the expected type.
 * Returns an error message string or null if valid.
 * @param field The target metric field definition.
 * @param currentMapping The current CsvColumnMapping state.
 * @param sampleDataRow The first row of sample data from the CSV (or undefined if not available).
 * @param csvHeaders An array of available CSV headers.
 * @param columnTransformations A map of column-specific transformation rules.
 * @param defaultTransformations Default transformation rules applied if no column-specific rules exist.
 * @returns An error message string or null.
 */
const validateFieldMapping = (
  field: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  },
  currentMapping: CsvColumnMapping, // Expect initialized mapping (never null)
  sampleDataRow: Record<string, string> | undefined,
  csvHeaders: string[],
  columnTransformations: Record<
    keyof DashboardMetrics,
    ColumnTransformationRules | undefined
  >,
  defaultTransformations?: ColumnTransformationRules,
): string | null => {
  const mappedHeader = currentMapping[field.key as keyof CsvColumnMapping];

  // 1. Check for required fields being unmapped (null in state, or UNMAPPED_SELECT_VALUE string representation)
  // The state uses `null` to represent "not mapped".
  if (field.required && mappedHeader === null) {
    return `Required field "${field.label}" is not mapped.`;
  }

  // 2. If mapped (is a string header value), validate the sample value against the expected type
  // `mappedHeader` being a string means it's mapped to a specific CSV column
  if (typeof mappedHeader === 'string') {
    // Check if the mapped header actually exists in the available headers
    if (!csvHeaders.includes(mappedHeader)) {
      // This handles outdated saved mappings or inconsistent data
      return `Mapped column "${mappedHeader}" for "${field.label}" not found in the CSV headers. Please select a valid column.`;
    }

    // Cannot validate value type without sample data
    if (!sampleDataRow) {
      // The mapping is structurally valid, but value type validation cannot be performed yet.
      // Could potentially return a soft warning, but for a hard 'isValid' check,
      // we return null here if sample data is missing and the mapping itself is valid.
      return null;
    }

    const sampleValue = sampleDataRow[mappedHeader];

    // Check if the mapped header exists as a key in the sample data row
    // This is a safeguard, should align with csvHeaders check, but confirms data structure.
    if (sampleValue === undefined) {
      // This indicates an inconsistency between the header list and the sample data row keys.
      // While unlikely if generated correctly, it's a necessary check.
      return `Sample data value missing for mapped column "${mappedHeader}" (${field.label}).`;
    }

    // Get column-specific transformations, fallback to default prop transformations
    const fieldTransformations =
      columnTransformations[field.key] || defaultTransformations;

    const valueError = validateValue(
      sampleValue,
      field.expectedType,
      field.label,
      mappedHeader, // Pass the actual mapped header string
      fieldTransformations, // Pass transformations for validation
    );
    if (valueError) {
      return valueError;
    }
  }
  // If mappedHeader is null and field is *not* required, it's validly unmapped.
  return null; // No error for this field
};

// --- Child Component for a Single Mapping Row ---
// Extracted to reduce the parent's render method complexity and allow memoization
interface MappingRowProps {
  field: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  };
  mappedHeader: string | null; // The current mapping value (header string or null)
  csvHeaders: string[];
  sampleDataRow: Record<string, string> | undefined;
  userCsvSynonyms?: { [key: string]: string[] };
  onSelectChange: (
    targetFieldKey: keyof DashboardMetrics,
    csvHeader: string | null, // Handle null for "Not Mapped"
  ) => void;
  validationError: string | null; // Specific error message for this field, if any
  defaultTransformations?: ColumnTransformationRules; // Default transformations prop from parent
  columnTransformations: Record<
    keyof DashboardMetrics,
    ColumnTransformationRules | undefined
  >; // Column-specific transformations state
  onOpenTransformModal: (field: {
    key: keyof DashboardMetrics;
    label: string;
  }) => void; // Handler to open modal
}

// Use memo to prevent unnecessary re-renders of rows if parent state unrelated to this row changes
const MappingRow: React.FC<MappingRowProps> = memo(
  ({
    field,
    mappedHeader,
    csvHeaders,
    sampleDataRow,
    userCsvSynonyms,
    onSelectChange,
    validationError,
    defaultTransformations,
    columnTransformations,
    onOpenTransformModal,
  }) => {
    // Add display name for easier debugging
    MappingRow.displayName = 'MappingRow';

    // Determine the value to display/use in the Select component
    // Select component expects a string value. Use UNMAPPED_SELECT_VALUE for null.
    const selectValue =
      mappedHeader === null ? UNMAPPED_SELECT_VALUE : mappedHeader;

    // Get the value from the sample row using the mapped header string (if mapped)
    const rawSampleValue =
      sampleDataRow && typeof mappedHeader === 'string' // Check if mappedHeader is a string (not null)
        ? sampleDataRow[mappedHeader]
        : undefined; // undefined if not mapped or no sample data

    // Apply transformations for displaying the sample value preview
    // Use column-specific transformations if they exist, otherwise use default prop transformations
    const fieldTransformations =
      columnTransformations[field.key] || defaultTransformations;
    const transformedSampleValue =
      rawSampleValue !== undefined
        ? applyTransformations(rawSampleValue, fieldTransformations)
        : undefined; // undefined if raw value was undefined

    // Prepare the sample value for display, handling undefined, empty, and escaping quotes
    const displayedSampleValue =
      transformedSampleValue !== undefined ? (
        transformedSampleValue !== '' ? (
          // Escape double quotes within the displayed text
          transformedSampleValue.replace(/"/g, '"')
        ) : (
          // Use an emphasized element for clarity if the value is an empty string after transformation
          <em>Empty Value</em>
        )
      ) : (
        // Indicate when no value is available (not mapped or no sample data)
        'N/A'
      );

    // Prepare the original sample value for the tooltip, handling undefined and escaping quotes
    const originalSampleValueForTooltip =
      rawSampleValue !== undefined
        ? // Ensure it's a string before replacing, handle undefined gracefully
          String(rawSampleValue).replace(/"/g, '"')
        : 'N/A';

    return (
      <div key={field.key} className={styles.mappingRow}>
        {/* Target Metric Cell */}
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
              <TooltipTrigger className={styles.hintTrigger}>
                <span className={styles.hint}>?</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{field.hint}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Expected Type Cell */}
        <div className={styles.expectedTypeCell}>
          <span className={styles.typeBadge}>{field.expectedType}</span>
        </div>

        {/* CSV Column Select & Transform Cell */}
        <div className={styles.csvColumnCell}>
          {/* Use the Select component value state */}
          <Select
            value={selectValue}
            onValueChange={(value: string) => {
              // Convert UNMAPPED_SELECT_VALUE string back to null for state
              onSelectChange(
                field.key,
                value === UNMAPPED_SELECT_VALUE ? null : value,
              );
            }}
          >
            <SelectTrigger
              id={'select-' + String(field.key)}
              className={`${styles.selectTrigger} ${
                validationError ? styles.selectError : '' // Apply error style if any error exists for this field
              }`}
            >
              <SelectValue placeholder="Select CSV Column" />
            </SelectTrigger>
            <SelectContent>
              {/* Add the 'Not Mapped' option, value is the constant string */}
              <SelectItem value={UNMAPPED_SELECT_VALUE}>
                -- Not Mapped --
              </SelectItem>
              {/* Map CSV headers to selectable items */}
              {csvHeaders.map((header) => {
                // Calculate similarity for suggestions
                const similarity = calculateSimilarity(
                  header,
                  field.label,
                  userCsvSynonyms,
                );
                const confidence = (similarity * 100).toFixed(0);
                return (
                  <SelectItem key={header} value={header}>
                    {header}{' '}
                    {/* Display similarity confidence if above threshold */}
                    {similarity > SIMILARITY_THRESHOLD && (
                      <span className={styles.confidence}>({confidence}%)</span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {/* Transformation Button */}
          {/* Only show if a column is mapped (i.e., selectValue is not UNMAPPED_SELECT_VALUE) */}
          {selectValue !== UNMAPPED_SELECT_VALUE && (
            <Button
              variant="ghost"
              size="icon"
              className={styles.transformButton}
              onClick={() => {
                // Call the parent's handler to open the modal for this field
                onOpenTransformModal({
                  key: field.key,
                  label: field.label,
                });
              }}
              // Escape double quotes in aria-label
              aria-label={`Configure transformations for "${field.label}"`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}

          {/* Display specific validation errors inline below the select */}
          {validationError && ( // Display the specific error for this field
            <p className={styles.errorText}>{validationError}</p>
          )}
        </div>

        {/* Sample Value Cell */}
        <div className={styles.sampleValueCell}>
          {/* Show sample value if mapped and available in sample data */}
          {/* Display the transformed sample value or N/A */}
          <Tooltip>
            <TooltipTrigger className={styles.sampleTextTrigger}>
              {displayedSampleValue}
            </TooltipTrigger>
            {/* Show original value in tooltip if different from displayed */}
            <TooltipContent>
              {/* Escape double quotes in tooltip text */}
              <p>Original: {originalSampleValueForTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  },
);

// --- Main Component ---

interface GenericCsvDataMapperProps {
  csvHeaders: string[];
  targetMetrics: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  }[];
  userCsvSynonyms?: { [key: string]: string[] };
  onApplyMapping?: (mapping: CsvColumnMapping) => void;
  // initialMapping prop uses DEFAULT_INITIAL_MAPPING internally if undefined.
  // It should provide a CsvColumnMapping object structure.
  initialMapping?: CsvColumnMapping;
  isLoading?: boolean; // Prop for parent indicating CSV data is loading (headers, sample)
  onCancel: () => void;
  sampleDataRow?: Record<string, string>; // To show sample values for preview/validation
  title: string;
  description: string;
  toolName: string; // Used for IndexedDB storage key
  transformations?: {
    // Default transformations applied to sample data for preview/validation (optional)
    trim?: boolean;
    case?: 'upper' | 'lower' | 'title';
    findReplace?: { find: string; replace: string }[];
  };
  // Future prop: Allow passing or receiving column-specific transformations
  // initialColumnTransformations?: Record<keyof DashboardMetrics, ColumnTransformationRules>;
  // onSaveColumnTransformations?: (key: keyof DashboardMetrics, rules: ColumnTransformationRules | undefined) => void;
}

const GenericCsvDataMapper: React.FC<GenericCsvDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onApplyMapping,
  initialMapping = DEFAULT_INITIAL_MAPPING, // Use default constant if prop is undefined
  isLoading = false,
  onCancel,
  sampleDataRow,
  title,
  description,
  toolName,
  userCsvSynonyms,
  transformations, // Pass default transformations down
}) => {
  // State for the current mapping from target fields to CSV headers
  // Initialize immediately with DEFAULT_INITIAL_MAPPING to satisfy type and avoid null checks
  // This state holds header strings or null for "Not Mapped"
  const [currentMapping, setCurrentMapping] = useState<CsvColumnMapping>(
    DEFAULT_INITIAL_MAPPING,
  );

  // State specifically for loading the config from IndexedDB on mount
  const [isMappingConfigLoading, setIsMappingConfigLoading] =
    useState<boolean>(true);
  // State to hold validation errors (map key to error message string)
  // Using a map allows easy lookup of the error for a specific field key
  const [validationErrorsMap, setValidationErrorsMap] = useState<
    Record<keyof DashboardMetrics, string | null>
  >({});
  // State for save button loading spinner
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State for the transformation configuration modal
  const [isTransformModalOpen, setIsTransformModalOpen] =
    useState<boolean>(false);
  // State to hold the metric key and label for the currently configured transformation field
  const [currentTransformField, setCurrentTransformField] = useState<{
    key: keyof DashboardMetrics;
    label: string;
  } | null>(null);

  // State to hold column-specific transformation rules
  // This state will need to be saved/loaded with the mapping
  const [columnTransformations, setColumnTransformations] = useState<
    Record<keyof DashboardMetrics, ColumnTransformationRules | undefined>
  >({});

  // --- Handler to open the transformation modal ---
  // This function is called by the child MappingRow component
  const handleOpenTransformModal = useCallback(
    (field: { key: keyof DashboardMetrics; label: string }) => {
      setCurrentTransformField(field); // Set the field for which transformations are being configured
      setIsTransformModalOpen(true); // Open the modal
    },
    [], // Dependencies: State setters are stable
  );

  // Effect to load saved mapping and transformations from IndexedDB on mount
  useEffect(() => {
    const loadMapping = async () => {
      setIsMappingConfigLoading(true);
      let loadedDbMapping: CsvColumnMapping | undefined;
      let loadedDbTransformations:
        | Record<keyof DashboardMetrics, ColumnTransformationRules | undefined>
        | undefined;

      if (toolName) {
        try {
          const savedRecord = await db.userCsvMappings
            .where('toolName')
            .equals(toolName)
            .last(); // Get the most recent mapping for the tool

          if (savedRecord) {
            loadedDbMapping = savedRecord.mapping;
            loadedDbTransformations = savedRecord.transformations; // Load transformations
            console.log(
              `Loaded mapping from IndexedDB for ${toolName}:`,
              loadedDbMapping,
            );
            console.log(
              `Loaded transformations from IndexedDB for ${toolName}:`,
              loadedDbTransformations,
            );
          }
        } catch (error) {
          console.error(
            `Error loading mapping from IndexedDB for ${toolName}:`,
            error,
          );
          // Show a non-blocking toast, allow component to proceed with defaults
          toast.warning(
            `Could not load saved mapping for ${toolName}. Using defaults.`,
          );
          // loadedDbMapping/Transformations remain undefined on error
        }
      }

      // Initialize mapping state: Start with DEFAULT_INITIAL_MAPPING,
      // then overlay values from DB, then values from initialMapping prop.
      // This ensures all keys exist and DB/prop take precedence.
      const newMapping: CsvColumnMapping = { ...DEFAULT_INITIAL_MAPPING };

      // Helper to apply a source mapping (from DB or prop) to the newMapping
      const applySourceMapping = (sourceMapping: CsvColumnMapping) => {
        Object.keys(sourceMapping).forEach((key) => {
          const k = key as keyof CsvColumnMapping;
          const mappedHeader = sourceMapping[k];
          // Only apply if the mappedHeader is null or exists in current csvHeaders
          if (
            mappedHeader === null ||
            (typeof mappedHeader === 'string' &&
              csvHeaders.includes(mappedHeader))
          ) {
            newMapping[k] = mappedHeader;
          } else if (typeof mappedHeader === 'string') {
            // If mapped header doesn't exist in current CSV, log a warning and reset mapping for this field
            console.warn(
              `CSV header "${mappedHeader}" for field "${String(k)}" not found in current CSV. Resetting mapping for this field.`,
            );
            newMapping[k] = null; // Reset to unmapped
          }
        });
      };

      // Apply DB mapping first (highest precedence)
      if (loadedDbMapping) {
        applySourceMapping(loadedDbMapping);
      }

      // Apply initialMapping prop (lower precedence than DB, intended for temporary/external initial state)
      // Only overlay if the prop value is explicitly defined and is not the default object itself
      if (initialMapping && initialMapping !== DEFAULT_INITIAL_MAPPING) {
        // Create a temporary mapping from initialMapping to apply,
        // ensuring it doesn't overwrite valid DB-loaded mappings unless explicitly intended.
        // For simplicity, we'll let it overwrite if the key exists, assuming prop is "latest external state".
        // Current order: DEFAULT -> DB -> PROP
        applySourceMapping(initialMapping);
      }

      setCurrentMapping(newMapping);

      // Initialize transformations state from DB or empty object
      // Filter out transformations for keys that are no longer in targetMetrics
      const filteredTransformations: Record<
        keyof DashboardMetrics,
        ColumnTransformationRules | undefined
      > = {};
      if (loadedDbTransformations) {
        targetMetrics.forEach((field) => {
          if (loadedDbTransformations[field.key]) {
            filteredTransformations[field.key] =
              loadedDbTransformations[field.key];
          }
        });
      }
      setColumnTransformations(filteredTransformations);

      setIsMappingConfigLoading(false);
    };

    // Only run this effect on initial mount or if toolName or csvHeaders change significantly.
    // Adding csvHeaders as a dependency ensures that if the user uploads a new CSV,
    // we re-evaluate saved mappings against the new headers.
    loadMapping(); // Call the async function
  }, [toolName, csvHeaders, initialMapping, targetMetrics]); // Dependency: toolName, csvHeaders, initialMapping, targetMetrics

  // Memoize the validation function
  const validateMapping = useCallback(() => {
    // Cannot validate if essential data is missing after loading, or if headers are missing
    if (csvHeaders.length === 0) {
      // If headers are missing, the component renders a "No headers" message,
      // so validation errors related to mapping/values are not relevant.
      // Clear errors in this state.
      setValidationErrorsMap({});
      return { isValid: false, errors: {} }; // Cannot proceed without headers
    }

    // If sample data is missing, we can only validate required fields being mapped.
    // Value type validation requires sample data.
    const canFullyValidate = sampleDataRow !== undefined;

    const errors: Record<keyof DashboardMetrics, string | null> = {};
    let isValid = true;

    // Check required fields and validate mapped values using the sample row
    for (const field of targetMetrics) {
      const fieldKey = field.key as keyof DashboardMetrics; // Use this consistently
      const fieldError = validateFieldMapping(
        field,
        currentMapping, // currentMapping is always initialized now
        canFullyValidate ? sampleDataRow : undefined, // Pass sample data only if available
        csvHeaders,
        columnTransformations,
        transformations, // Pass default transformations
      );
      errors[fieldKey] = fieldError; // Store error message or null for this field
      if (fieldError) {
        isValid = false; // Mark overall validation as failed
      }
    }

    setValidationErrorsMap(errors); // Update the map of errors
    return { isValid, errors }; // Return validation result
  }, [
    currentMapping,
    targetMetrics,
    sampleDataRow,
    transformations,
    columnTransformations,
    csvHeaders, // Add csvHeaders as dependency because validateFieldMapping uses it
  ]); // Include all dependencies

  // Effect to run validation whenever relevant data or mapping changes
  useEffect(() => {
    // Don't validate until mapping configuration is loaded from DB/initialized
    // and essential CSV data (headers and potentially sample data) is available.
    if (isMappingConfigLoading || csvHeaders.length === 0) {
      setValidationErrorsMap({}); // Clear errors while loading or if headers missing
      return;
    }
    // Debounce validation if it becomes expensive? Not needed for single row sample validation.
    validateMapping();
    // validateMapping is a useCallback, its dependencies are listed there.
    // This effect reruns when validateMapping itself changes (due to its dependencies changing)
  }, [validateMapping, isMappingConfigLoading, csvHeaders.length]); // Also depend on loading state and headers presence

  // Handler for select change (passed to child rows)
  const handleSelectChange = useCallback(
    (
      targetFieldKey: keyof DashboardMetrics,
      csvHeader: string | null, // The selected value from the Select component, converted to null for UNMAPPED_SELECT_VALUE
    ) => {
      setCurrentMapping((prev) => {
        // Create a shallow copy to update state immutably
        const newMapping: CsvColumnMapping = { ...prev };
        // The value is already null or a string header
        newMapping[targetFieldKey as keyof CsvColumnMapping] = csvHeader;

        // When a column is unmapped (set back to null), remove any column-specific transformations for it
        if (csvHeader === null) {
          setColumnTransformations((prevTrans) => {
            const newTrans = { ...prevTrans };
            // Delete the key to represent no specific transformation for this field
            delete newTrans[targetFieldKey];
            return newTrans;
          });
        }

        return newMapping;
      });
    },
    [], // No external dependencies for this setter logic itself
  );

  // Helper function to save mapping and transformations to DB
  const saveMappingToDb = useCallback(
    async (
      mappingToSave: CsvColumnMapping,
      transformationsToSave: Record<
        keyof DashboardMetrics,
        ColumnTransformationRules | undefined
      >,
    ) => {
      if (!toolName) {
        console.warn('toolName prop not provided. Skipping IndexedDB save.');
        // Optionally toast a message to the user
        toast.info('Cannot save preferences: Tool identifier missing.');
        return;
      }

      try {
        // Using put for simplicity (upsert).
        // Ensure the mapping object saved to DB contains all keys from DEFAULT_INITIAL_MAPPING
        // to prevent issues if the targetMetrics change between saves/loads.
        // This ensures the schema is consistent in the DB, even if targetMetrics is a subset.
        const fullMappingObject: CsvColumnMapping = {
          ...DEFAULT_INITIAL_MAPPING,
          ...mappingToSave,
        };

        // Save transformations. Filter out keys with undefined/empty rules if preferred for cleaner storage,
        // but saving the full object structure as in state is simpler for load/save consistency.
        const transformationsToPersist = transformationsToSave;

        // TODO: Ensure IndexedDB schema 'userCsvMappings' includes 'transformations' field
        // This is a note for the IndexedDB schema definition file, not this component.
        await db.userCsvMappings.put({
          toolName,
          mapping: fullMappingObject, // Save the full mapping object
          transformations: transformationsToPersist, // Save transformations state
          timestamp: new Date(), // Add timestamp for potential future "last used" logic or history
        });
        console.log(
          `Mapping preferences saved to DB for ${toolName}:`,
          fullMappingObject,
          transformationsToPersist,
        );
        toast.success('Mapping preferences saved!');
      } catch (error) {
        console.error(
          `Error saving mapping preferences to DB for ${toolName}:`,
          error,
        );
        toast.error('Failed to save mapping preferences.');
      }
    },
    [toolName], // Dependency: toolName
  );

  // Handler for Apply & Save button
  // Reduced cognitive complexity by using early returns and extracted helpers
  const handleApplyAndSavePrefs = async () => {
    setIsSaving(true);

    // 1. Validate before applying
    const { isValid, errors } = validateMapping(); // Use the memoized validation and get results

    if (!isValid) {
      // validateMapping already updated validationErrorsMap state
      // Display field-specific errors in the UI via validationErrorsMap state (already done by effect)
      toast.error('Please fix mapping errors before applying.');
      setIsSaving(false);
      return; // Exit if validation fails
    }

    // 2. Save to IndexedDB (async operation)
    // currentMapping is guaranteed to be initialized (not null) based on component guards/initial state
    await saveMappingToDb(currentMapping, columnTransformations); // Pass transformations to save

    // 3. Call parent's callback if valid and provided
    if (typeof onApplyMapping === 'function') {
      // Pass the current mapping state
      onApplyMapping(currentMapping);
      console.log('onApplyMapping callback executed.');
    } else if (onApplyMapping !== undefined) {
      // Log error if prop is provided but not a function
      console.error(
        "GenericCsvDataMapper Error: Invalid 'onApplyMapping' prop. Expected a function or undefined.",
      );
      // Consider if a toast is appropriate here, as it's a dev/config error
      // toast.error('Configuration error: Cannot apply mapping due to an invalid callback.');
    }
    // If onApplyMapping is undefined, it's optional, do nothing.

    setIsSaving(false); // Reset saving state
  };

  // Memoize the reset function
  const handleResetMapping = useCallback(() => {
    // Reset mapping state to the initial value provided by the prop (which defaults to DEFAULT_INITIAL_MAPPING)
    // This ensures the reset mapping structure matches the required targetMetrics keys and full CsvColumnMapping type.
    // A simple assignment works because initialMapping is stable (either the default constant or a prop value).
    setCurrentMapping(initialMapping);
    setColumnTransformations({}); // Reset transformations too
    setValidationErrorsMap({}); // Clear any previous validation errors
    toast.info('Mapping has been reset to defaults.');
    // Dependencies: initialMapping prop. If initialMapping can change *after* mount,
    // this dependency is needed. Assuming it's static, it could be omitted,
    // but including defensively adds robustness if prop usage changes.
  }, [initialMapping]); // Depend on initialMapping prop

  // Determine if the Apply button should be disabled
  const isApplyButtonDisabled = useMemo(
    () =>
      isSaving ||
      isLoading || // Disable if parent is loading CSV data
      isMappingConfigLoading || // Disable if mapping config is loading from DB
      csvHeaders.length === 0 || // Disable if no headers loaded
      Object.values(validationErrorsMap).some((error) => error !== null), // Disable if ANY validation errors exist
    // currentMapping is always initialized now, no need to check !currentMapping
    [
      isSaving,
      isLoading,
      isMappingConfigLoading,
      validationErrorsMap,
      csvHeaders.length,
    ],
  );

  // Handler for applying transformations from the modal
  const handleApplyTransformations = useCallback(
    (fieldKey: keyof DashboardMetrics, rules: ColumnTransformationRules) => {
      setColumnTransformations((prev) => {
        const newTrans = { ...prev };
        // Store the rules. If rules object is empty, we could potentially delete the key
        // for cleaner state/storage, but storing empty rules is also fine and simpler.
        newTrans[fieldKey] = rules;
        return newTrans;
      });
      // Re-validate immediately to show effect of transformations on sample value
      // Note: validateMapping depends on columnTransformations, so this update triggers re-validation naturally.
      setIsTransformModalOpen(false); // Close modal after applying (or saving)
    },
    [], // No dependencies needed for this state update logic
  );

  // --- Render Logic ---

  // Show loading states based on props and internal state
  // Also consider the case where csvHeaders are not yet loaded
  if (isLoading || isMappingConfigLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        {isLoading ? 'Loading CSV data...' : 'Loading mapping configuration...'}
      </div>
    );
  }

  // Show message if no CSV headers are provided after loading
  if (!csvHeaders || csvHeaders.length === 0) {
    return (
      <div className={styles.noHeaders}>
        No CSV headers found. Please upload a valid CSV.
      </div>
    );
  }

  // If mapping is still null here unexpectedly after loading, handle as error?
  // With state initialized to DEFAULT_INITIAL_MAPPING, this case should ideally not happen.
  // Adding a safeguard check just in case, though it might indicate a logic flaw elsewhere.
  // This check also helps TypeScript understand currentMapping is not null below.
  if (currentMapping === null) {
    console.error('GenericCsvDataMapper: Mapping state is null after loading.');
    // Display a user-friendly error message
    return (
      <div className={styles.error}>Error loading mapping configuration.</div>
    );
  }

  return (
    <TooltipProvider>
      <div className={styles.mapperContainer}>
        {/* Use fragment if styles.mapperContainer is not the outermost element */}
        <h3 className={styles.title}>{title}</h3>
        <p>{description}</p>

        {/* Display overall validation errors summary */}
        {Object.values(validationErrorsMap).some((error) => error !== null) && (
          <div className={styles.validationErrors}>
            <h4>Mapping Errors:</h4>
            <ul>
              {/* Collect unique error messages */}
              {[
                ...new Set(
                  Object.values(validationErrorsMap).filter(
                    (e): e is string => e !== null,
                  ),
                ),
              ].map((error, index) => (
                // Using error string as key is generally safe for a Set of unique strings.
                // If error messages might not be unique or are very long, use index.
                // For user-facing messages derived from validation, unique strings are common.
                <li key={error || index} className={styles.validationErrorItem}>
                  {/* Escape quotes just in case error message contains them */}
                  {error.replace(/"/g, '"')}
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
              Sample Value (Preview)
            </div>
            {/* Transformation column header is implicitly part of CSV Column column now */}
          </div>

          {/* Map over target metrics to create mapping rows using the extracted component */}
          {targetMetrics.map((field) => {
            const fieldKey = field.key as keyof DashboardMetrics; // Ensure key type is correct
            const mappedHeader = currentMapping[fieldKey]; // Get the mapped header (string or null)

            return (
              <MappingRow
                key={field.key} // Use metric key as key for list rendering
                field={field}
                mappedHeader={mappedHeader} // Pass the string or null value
                csvHeaders={csvHeaders}
                sampleDataRow={sampleDataRow}
                userCsvSynonyms={userCsvSynonyms}
                onSelectChange={handleSelectChange} // Pass the handler down
                validationError={validationErrorsMap[fieldKey]} // Pass the specific error for this field
                defaultTransformations={transformations} // Pass default transformations prop
                columnTransformations={columnTransformations} // Pass column-specific transformations state
                onOpenTransformModal={handleOpenTransformModal} // Pass modal handler
              />
            );
          })}
        </div>

        {/* CSV Row Preview (Simplified to show only the single sample row) */}
        {sampleDataRow && csvHeaders.length > 0 && (
          <div className={styles.previewContainer}>
            <h4 className={styles.previewTitle}>
              Sample CSV Data Preview (First Row)
            </h4>
            <div className={styles.previewTableContainer}>
              {' '}
              {/* Add container for potential scrolling */}
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    {csvHeaders.map((header) => (
                      // Escape double quotes in header text for safety
                      <th key={header} className={styles.previewHeaderCell}>
                        {header.replace(/"/g, '"')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Render only the single sampleDataRow */}
                  <tr className={styles.previewRow}>
                    {csvHeaders.map((header) => (
                      // Escape double quotes in cell data for safety
                      // Ensure value exists before attempting replace
                      <td key={header} className={styles.previewDataCell}>
                        {sampleDataRow[header] !== undefined
                          ? String(sampleDataRow[header]).replace(/"/g, '"')
                          : ''}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button
            onClick={handleApplyAndSavePrefs}
            className={styles.submitButton}
            disabled={isApplyButtonDisabled}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Mapping & Save Preferences {/* Use & for & */}
          </Button>
          <Button
            onClick={handleResetMapping}
            variant="outline"
            className={styles.resetButton}
            disabled={isSaving || isLoading || isMappingConfigLoading}
          >
            Reset Mapping
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className={styles.cancelButton}
            disabled={isSaving || isLoading || isMappingConfigLoading}
          >
            Cancel
          </Button>
          {/* Sample CSV Download Button (assuming SampleCsvButton component is available and used elsewhere) */}
          {/*
           {toolName && (
             <SampleCsvButton toolName={toolName} />
           )}
           */}
        </div>

        {/* Transformation Configuration Modal */}
        {/* TODO: Implement actual transformation configuration UI */}
        {/* TODO: Implement UI to configure transformations for currentTransformField */}
        {/* These TODOs refer to the content of TransformationModalContent, which is a separate component. */}
        {/* The integration logic here seems correct, passing necessary props. */}
        <Dialog
          open={isTransformModalOpen}
          onOpenChange={setIsTransformModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Configure Transformations for &quot;
                {currentTransformField?.label}&quot;{' '}
                {/* Escape double quotes */}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {currentTransformField && (
                <TransformationModalContent
                  fieldLabel={currentTransformField.label}
                  initialRules={
                    columnTransformations[currentTransformField.key]
                  }
                  onApplyRules={(rules) =>
                    handleApplyTransformations(currentTransformField.key, rules)
                  }
                  onCancel={() => setIsTransformModalOpen(false)}
                />
              )}
            </div>
            <DialogFooter>
              {/* Buttons are now handled within TransformationModalContent */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default GenericCsvDataMapper;
