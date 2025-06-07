import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast.ts';

import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation';
import {
  transformCsvRow,
  TransformationError,
  CsvRowTransformationResult,
} from '@/lib/utils/amazon/data-transformation';
import { SAMPLE_CHART_DATA } from '@/data/amazon-tools-sample-data/amazon-dashboard-sample-data';
import { INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY } from '@/lib/constants';
import { getItem, setItem } from '@/lib/indexeddb-service';
import type { CsvColumnMapping } from '@/types/data-mapping';
import {
  DashboardMetrics,
  DashboardViewPreferences,
  TimeRange,
  AggregatedProductMetrics,
} from '@/lib/amazon-tools/types';
import { TARGET_METRICS_CONFIG } from '@/config/amazon-tools-config';
import useDebounce from '@/hooks/use-debounce'; // Import shared useDebounce hook

/**
 * `useAmazonDataIntegration` is a custom hook that encapsulates all data loading, parsing,
 * transformation, and state management for the Amazon Seller Tools dashboard.
 * It acts as the exclusive data source, providing processed metrics and
 * related states/callbacks to components that consume it.
 *
/**
 * Defines the return type of the `useAmazonDataIntegration` hook.
 * This interface lists all the states, derived data, and callback functions
 * that the hook exposes to its consumers.
 */
export interface UseAmazonDataIntegrationReturn {
  metrics: DashboardMetrics[];
  isLoading: boolean;
  isParsing: boolean;
  error: string | null;
  searchTerm: string;
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timeRange: TimeRange;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  aggregatedAndSortedMetrics: DashboardMetrics[];
  productPerformanceData: AggregatedProductMetrics[];
  productPerformanceTableColumns: {
    accessorKey: string;
    header: string;
    copyable?: boolean;
    analyzeInTool?: { toolName: string; paramName: string };
  }[];
  productPerformanceRowIdAccessor: (row: AggregatedProductMetrics) => string;
  onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void;
  onRefreshData: () => void;
  onLoadSampleData: () => void;
  onUploadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSampleCsv: () => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  showMapper: boolean;
  csvHeaders: string[];
  firstCsvDataRow: Record<string, string> | undefined;
  handleMappingComplete: (mapping: CsvColumnMapping) => Promise<void>;
  handleMappingCancel: () => void;
  savedMapping: CsvColumnMapping | null;
  parsingErrors: TransformationError[];
  isUploading: boolean;
  isMapping: boolean;
  isProcessing: boolean;
  totalRows: number;
  processedRows: number;
  setTimeGranularity: React.Dispatch<
    React.SetStateAction<
      'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    >
  >;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>;
  setCustomDateRange: React.Dispatch<
    React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>
  >;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  overviewDataMapperKey: number;
}

/**
 * @returns {object} An object containing various states, derived data, and callback functions.
 */
export const useAmazonDataIntegration = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showMapper, setShowMapper] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMapping, setIsMapping] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstCsvDataRow, setFirstCsvDataRow] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [timeGranularity, setTimeGranularity] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('daily');
  const [timeRange, setTimeRange] = useState<TimeRange>('custom');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const [overviewDataMapperKey, setOverviewDataMapperKey] = useState(0); // Used to force remount of mapper
  const [savedMapping, setSavedMapping] = useState<CsvColumnMapping | null>(
    null,
  );
  const [parsingErrors, setParsingErrors] = useState<TransformationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalRowsRef = useRef(0);
  const processedRowsRef = useRef(0);
  const { toast } = useToast();

  // Debounced state for view preferences to avoid excessive IndexedDB writes
  const debouncedTimeRange = useDebounce(timeRange, 500);
  const debouncedTimeGranularity = useDebounce(timeGranularity, 500);
  const debouncedCustomDateRange = useDebounce(customDateRange, 500);

  // Load dashboard view preferences from IndexedDB on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const storedPreferences = await getItem<DashboardViewPreferences>(
        INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY,
      );
      if (storedPreferences) {
        setTimeGranularity(storedPreferences.timeGranularity);
        setTimeRange(storedPreferences.timeRange);
        setCustomDateRange(
          storedPreferences.customDateRange || {
            from: undefined,
            to: undefined,
          },
        );
      }
    };
    loadPreferences();
  }, []);

  // Save dashboard view preferences to IndexedDB when debounced values change
  useEffect(() => {
    const savePreferences = async () => {
      await setItem(INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY, {
        timeGranularity: debouncedTimeGranularity,
        timeRange: debouncedTimeRange,
        customDateRange: debouncedCustomDateRange,
      });
      console.log('Dashboard view preferences saved to IndexedDB.');
    };
    savePreferences();
  }, [debouncedTimeGranularity, debouncedTimeRange, debouncedCustomDateRange]);

  // Load saved CSV column mapping from IndexedDB on mount
  useEffect(() => {
    const loadSavedMapping = async () => {
      const storedMapping = await getItem<CsvColumnMapping>('last_csv_mapping');
      if (storedMapping) {
        setSavedMapping(storedMapping);
        console.log('Loaded saved mapping:', storedMapping);
      }
    };
    loadSavedMapping();
  }, []);

  /**
   * Resets all data and state related to data integration, effectively clearing the dashboard.
   */
  const handleRefreshData = useCallback(async () => {
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]);
    setOverviewDataMapperKey((prev) => prev + 1); // Force remount of mapper
    setIsLoading(true);
    totalRowsRef.current = 0;
    processedRowsRef.current = 0;
    setTimeGranularity('daily');
    setTimeRange('custom');
    setCustomDateRange({ from: undefined, to: undefined });
    await setItem(INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY, null); // Clear saved preferences

    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
    setIsLoading(false);
    await setItem('last_csv_mapping', null); // Clear saved mapping
    setSavedMapping(null);
  }, [
    setIsLoading,
    setError,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setMetrics,
    setOverviewDataMapperKey,
    setTimeGranularity,
    setTimeRange,
    setCustomDateRange,
    setSavedMapping,
  ]);

  /**
   * Loads sample data into the dashboard metrics state.
   */
  const handleLoadSampleData = useCallback(() => {
    setIsLoading(true);
    setMetrics(SAMPLE_CHART_DATA as DashboardMetrics[]);
    setError(null);
    setParsingErrors([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    totalRowsRef.current = SAMPLE_CHART_DATA.length;
    processedRowsRef.current = SAMPLE_CHART_DATA.length;

    setTimeRange('custom'); // Reset time range for sample data
    setCustomDateRange({ from: undefined, to: undefined });

    toast({
      title: 'Sample Data Loaded',
      description: `Loaded ${SAMPLE_CHART_DATA.length} rows of sample data.`,
      variant: 'success',
      duration: 3000,
    });

    setTimeout(() => setIsLoading(false), 500); // Simulate loading
  }, [
    setIsLoading,
    setMetrics,
    setError,
    setParsingErrors,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setTimeRange,
    setCustomDateRange,
    toast,
  ]);

  /**
   * Handles the completion of CSV parsing (headers and first row).
   * @param results The PapaParse results object.
   */
  const handleCsvParseComplete = useCallback(
    (results: Papa.ParseResult<Record<string, string>>) => {
      const headers = results.meta.fields;
      const sampleRow = results.data[0] as Record<string, string> | undefined;
      if (!headers || headers.length === 0) {
        setError('Could not read headers from the CSV file. Is it valid?');
        toast({
          title: 'Upload Failed',
          description: 'Could not read headers from the CSV file. Is it valid?',
          variant: 'destructive',
        });
        setIsParsing(false);
        setIsUploading(false);
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setCsvHeaders(headers);
      setFirstCsvDataRow(sampleRow);
      setShowMapper(true); // Show the mapping UI
      setIsParsing(false);
      setIsUploading(false);
      setIsLoading(false);
      setIsMapping(true); // Indicate that mapping is now active
      toast({
        title: 'CSV Uploaded Successfully',
        description: 'Now mapping your data columns.',
        variant: 'success',
        duration: 3000,
      });
    },
    [
      setError,
      setCsvHeaders,
      setFirstCsvDataRow,
      setShowMapper,
      setIsParsing,
      setIsUploading,
      setIsLoading,
      setIsMapping,
      fileInputRef,
      toast,
    ],
  );

  /**
   * Handles errors during CSV parsing.
   * @param error The PapaParse error object.
   */
  const handleCsvParseError = useCallback(
    (error: Error) => {
      setError(`Failed to read file headers: ${error.message}`);
      toast({
        title: 'Upload Error',
        description: `Failed to read file headers: ${error.message}`,
        variant: 'destructive',
      });
      setIsParsing(false);
      setIsUploading(false);
      setIsLoading(false);
      setIsMapping(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [
      setError,
      setIsParsing,
      setIsUploading,
      setIsLoading,
      setIsMapping,
      fileInputRef,
      toast,
    ],
  );

  /**
   * Handles the upload of a CSV file, parses its headers and first row, and prepares for mapping.
   * @param event The file input change event.
   */
  const handleUploadFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: 'No file selected',
          description: 'Please choose a CSV file to upload.',
          variant: 'warning',
        });
        return;
      }

      setIsUploading(true);
      setIsParsing(true);
      setIsLoading(true);
      setError(null);
      setParsingErrors([]);
      setMetrics([]);
      setShowMapper(false);
      setCsvHeaders([]);
      setSelectedFile(file); // Set selected file here
      setFirstCsvDataRow(undefined);
      setIsMapping(false);
      setIsProcessing(false);
      totalRowsRef.current = 0;
      processedRowsRef.current = 0;

      toast({
        title: 'CSV Upload Started',
        description: 'Uploading and parsing your CSV file...',
        variant: 'info',
        duration: 3000,
      });

      Papa.parse<Record<string, string>>(file, {
        header: true,
        preview: 2, // Only parse enough to get headers and first data row
        skipEmptyLines: true,
        complete: handleCsvParseComplete, // Use extracted function
        error: handleCsvParseError, // Use extracted function
      });
    },
    [
      toast,
      setError,
      setParsingErrors,
      setMetrics,
      setShowMapper,
      setCsvHeaders,
      setSelectedFile, // Add setSelectedFile to dependencies
      setFirstCsvDataRow,
      setIsUploading,
      setIsParsing,
      setIsLoading,
      setIsMapping,
      setIsProcessing,
      handleCsvParseComplete,
      handleCsvParseError,
    ],
  );

  /**
   * Processes the entire CSV file using the provided column mapping.
   * @param file The File object to process.
   * @param currentMapping The CsvColumnMapping to use for transformation.
   * @returns A promise resolving to an object containing valid metrics, collected errors, and total rows.
   */
  const processCsvData = useCallback(
    async (
      file: File,
      currentMapping: CsvColumnMapping,
    ): Promise<{
      validMetrics: DashboardMetrics[];
      collectedErrors: TransformationError[];
      totalRows: number;
    }> => {
      const allRows: Record<string, string>[] = [];
      return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          step: (rowParseResult) => {
            if (rowParseResult.data) {
              allRows.push(rowParseResult.data);
            }
            processedRowsRef.current = allRows.length; // Update progress
          },
          complete: () => {
            totalRowsRef.current = allRows.length;
            const validMetrics: DashboardMetrics[] = [];
            const collectedErrors: TransformationError[] = [];

            allRows.forEach((row, i) => {
              const result: CsvRowTransformationResult = transformCsvRow(
                row,
                currentMapping,
                i,
                TARGET_METRICS_CONFIG,
              );
              if (result.data) {
                validMetrics.push(result.data);
              }
              collectedErrors.push(...result.errors);
            });
            resolve({
              validMetrics,
              collectedErrors,
              totalRows: allRows.length,
            });
          },
          error: (error: Error) => reject(error),
        });
      });
    },
    [], // Dependencies are empty because allRows, currentMapping, resolve, reject are in the outer scope of the Promise, not the useCallback
  );

  /**
   * Helper function to filter metrics for the last 7 days.
   * @param metrics The array of DashboardMetrics to filter.
   * @param now The current date.
   * @returns Filtered metrics.
   */
  const filterLast7Days = useCallback(
    (metrics: DashboardMetrics[], now: Date) => {
      return metrics.filter(
        (m) =>
          new Date(m.date) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      );
    },
    [],
  );

  /**
   * Helper function to filter metrics for the last 30 days.
   * @param metrics The array of DashboardMetrics to filter.
   * @param now The current date.
   * @returns Filtered metrics.
   */
  const filterLast30Days = useCallback(
    (metrics: DashboardMetrics[], now: Date) => {
      return metrics.filter(
        (m) =>
          new Date(m.date) >=
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      );
    },
    [],
  );

  /**
   * Helper function to filter metrics for month to date.
   * @param metrics The array of DashboardMetrics to filter.
   * @param startOfMonth The start date of the current month.
   * @param endOfMonth The end date of the current month.
   * @returns Filtered metrics.
   */
  const filterMonthToDate = useCallback(
    (metrics: DashboardMetrics[], startOfMonth: Date, endOfMonth: Date) => {
      return metrics.filter(
        (m) =>
          new Date(m.date) >= startOfMonth && new Date(m.date) <= endOfMonth,
      );
    },
    [],
  );

  /**
   * Helper function to filter metrics for year to date.
   * @param metrics The array of DashboardMetrics to filter.
   * @param startOfYear The start date of the current year.
   * @param endOfYear The end date of the current year.
   * @returns Filtered metrics.
   */
  const filterYearToDate = useCallback(
    (metrics: DashboardMetrics[], startOfYear: Date, endOfYear: Date) => {
      return metrics.filter(
        (m) => new Date(m.date) >= startOfYear && new Date(m.date) <= endOfYear,
      );
    },
    [],
  );

  /**
   * Helper function to filter metrics for a custom date range.
   * @param metrics The array of DashboardMetrics to filter.
   * @param customRange The custom date range { from, to }.
   * @returns Filtered metrics.
   */
  const filterCustomRange = useCallback(
    (
      metrics: DashboardMetrics[],
      customRange: { from: Date | undefined; to: Date | undefined },
    ) => {
      if (customRange.from && customRange.to) {
        return metrics.filter(
          (m) =>
            new Date(m.date) >= customRange.from! &&
            new Date(m.date) <= customRange.to!,
        );
      }
      return metrics; // Return all if custom range is invalid
    },
    [],
  );

  /**
   * Generates a status message and toast variant based on processing results.
   * @param validMetrics The array of successfully transformed metrics.
   * @param totalRows The total number of rows processed.
   * @param collectedErrors The array of transformation errors and warnings.
   * @returns An object containing message, variant, and title for the toast.
   */
  const generateProcessingStatus = useCallback(
    (
      validMetrics: DashboardMetrics[],
      totalRows: number,
      collectedErrors: TransformationError[],
    ): {
      message: string;
      variant: 'success' | 'warning' | 'destructive' | 'info';
      title: string;
    } => {
      const errorCount = collectedErrors.filter(
        (e) => e.type === 'error',
      ).length;
      const warningCount = collectedErrors.filter(
        (e) => e.type === 'warning',
      ).length;
      const skippedRows = totalRows - validMetrics.length;

      let statusMessage = `Successfully processed ${validMetrics.length} of ${totalRows} rows.`;
      let toastVariant: 'success' | 'warning' | 'destructive' | 'info' =
        'success';
      let toastTitle = 'Data Processing Complete';

      if (skippedRows > 0) {
        statusMessage += ` ${skippedRows} row(s) were skipped due to critical errors.`;
      }

      if (warningCount > 0) {
        statusMessage += ` Found ${warningCount} warning(s).`;
      }

      // Determine variant and title based on counts
      if (errorCount > 0) {
        toastVariant = 'destructive';
        toastTitle = 'Data Processing with Errors';
      } else if (warningCount > 0 || skippedRows > 0) {
        toastVariant = 'warning';
        toastTitle = 'Data Processing with Warnings';
      } else {
        toastVariant = 'success';
        toastTitle = 'Data Processing Complete';
      }

      return {
        message: statusMessage,
        variant: toastVariant,
        title: toastTitle,
      };
    },
    [],
  );

  /**
   * Handles the completion of column mapping, triggering the full CSV data processing.
   * @param mapping The completed CsvColumnMapping object.
   */
  const handleMappingComplete = useCallback(
    async (mapping: CsvColumnMapping) => {
      if (!selectedFile) {
        setError('No file selected for processing.');
        setShowMapper(false);
        setIsMapping(false);
        return;
      }

      setShowMapper(false);
      setIsMapping(false);
      setIsProcessing(true);
      setError(null);
      setParsingErrors([]);
      setMetrics([]);
      totalRowsRef.current = 0;
      processedRowsRef.current = 0;

      try {
        const { validMetrics, collectedErrors, totalRows } =
          await processCsvData(selectedFile, mapping);

        setMetrics(validMetrics);
        setParsingErrors(collectedErrors);
        totalRowsRef.current = totalRows;

        const { message, variant, title } = generateProcessingStatus(
          validMetrics,
          totalRows,
          collectedErrors,
        );

        toast({
          title,
          description: message,
          variant,
          duration: 5000,
        });

        await setItem('last_csv_mapping', mapping); // Save mapping for future use
        console.log('Valid Metrics:', validMetrics);
        console.log('Collected Errors/Warnings:', collectedErrors);
        console.log('Mapping saved to IndexedDB.');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to parse file: ${errorMessage}`);
        setParsingErrors([
          {
            rowNumber: -1,
            column: 'File',
            message: `General CSV parsing error: ${errorMessage}`,
            type: 'error',
          },
        ]);
        toast({
          title: 'Processing Error',
          description: `Failed to process CSV data: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
        setSelectedFile(null); // Clear selected file after processing
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
        totalRowsRef.current = 0;
        processedRowsRef.current = 0;
      }
    },
    [
      setError,
      setShowMapper,
      setIsMapping,
      setIsProcessing,
      setParsingErrors,
      setMetrics,
      toast,
      fileInputRef,
      selectedFile,
      processCsvData,
      generateProcessingStatus,
    ],
  );

  /**
   * Handles the cancellation of column mapping, resetting related states.
   */
  const handleMappingCancel = useCallback(() => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]);
    setOverviewDataMapperKey((prev) => prev + 1); // Force remount of mapper
    setIsParsing(false);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Mapping cancelled.');
  }, [
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setError,
    setParsingErrors,
    setOverviewDataMapperKey,
    setIsParsing,
    setIsLoading,
  ]);

  /**
   * Initiates the download of a sample CSV file.
   */
  const handleDownloadSampleCsv = useCallback(async () => {
    const fileName = 'sample_amazon_data.csv';
    const filePath = `/samples/${fileName}`;
    console.log('Attempting to download file from:', filePath);

    try {
      const link = document.createElement('a');
      link.href = filePath;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download initiated successfully.');
    } catch (err: unknown) {
      console.error('Error downloading sample CSV:', err);
      setError(
        `Download failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [setError]);

  /**
   * Deletes a specific metric entry from the state based on date and optional identifier.
   * @param metricDate The date of the metric to delete.
   * @param metricIdentifier Optional unique identifier for the metric (e.g., ASIN/SKU).
   */
  const onDeleteMetric = useCallback(
    (metricDate: string, metricIdentifier?: string) => {
      setMetrics((prevMetrics) =>
        prevMetrics.filter(
          (metric) =>
            metric.date !== metricDate ||
            (metricIdentifier && metric.unique_identifier !== metricIdentifier),
        ),
      );
    },
    [setMetrics],
  );

  // Memoized sorted daily metrics for consistent ordering
  const dailySortedMetrics = useMemo(
    () =>
      [...metrics].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // Handle invalid dates gracefully
        }

        return dateA.getTime() - dateB.getTime();
      }),
    [metrics],
  );

  /**
   * Filters and aggregates dashboard metrics by the selected time range and granularity.
   * @param dataToFilter The raw DashboardMetrics array to filter.
   * @param range The selected TimeRange (e.g., 'last_7_days', 'month_to_date', 'custom').
   * @param customRange The custom date range if `range` is 'custom'.
   * @returns An array of aggregated DashboardMetrics.
   */
  const filterAndAggregateMetricsByTimeRange = useCallback(
    (
      dataToFilter: DashboardMetrics[],
      range: TimeRange,
      customRange: { from: Date | undefined; to: Date | undefined },
    ) => {
      const validDateMetrics = dataToFilter.filter((m) => {
        if (!m.date || typeof m.date !== 'string') {
          return false;
        }
        const d = new Date(m.date);
        return !isNaN(d.getTime());
      });

      let filtered = validDateMetrics;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      switch (range) {
        case 'last_7_days':
          filtered = filterLast7Days(validDateMetrics, now);
          break;
        case 'last_30_days':
          filtered = filterLast30Days(validDateMetrics, now);
          break;
        case 'month_to_date':
          filtered = filterMonthToDate(
            validDateMetrics,
            startOfMonth,
            endOfMonth,
          );
          break;
        case 'year_to_date':
          filtered = filterYearToDate(validDateMetrics, startOfYear, endOfYear);
          break;
        case 'custom':
          filtered = filterCustomRange(validDateMetrics, customRange);
          break;
        case 'all_time':
        default:
          break;
      }
      return aggregateMetricsByTime(filtered, timeGranularity);
    },
    [
      timeGranularity,
      filterLast7Days,
      filterLast30Days,
      filterMonthToDate,
      filterYearToDate,
      filterCustomRange,
    ], // Add helper functions to dependencies
  );

  // Memoized aggregated and sorted metrics based on current time range and granularity
  const aggregatedAndSortedMetrics = useMemo(
    () =>
      filterAndAggregateMetricsByTimeRange(
        dailySortedMetrics,
        timeRange,
        customDateRange,
      ),
    [
      dailySortedMetrics,
      timeRange,
      customDateRange,
      filterAndAggregateMetricsByTimeRange,
    ],
  );

  /**
   * Filters dashboard metrics based on a search term, matching against ASIN, SKU, or keywords.
   * @param allMetrics The array of all DashboardMetrics.
   * @param term The search term.
   * @returns A filtered array of DashboardMetrics.
   */
  const filterMetricsBySearchTerm = useCallback(
    (allMetrics: DashboardMetrics[], term: string) => {
      const searchTermLower = term.toLowerCase();
      if (!searchTermLower) {
        return allMetrics;
      }
      return allMetrics.filter((metric) => {
        const fieldsToSearch = [
          metric.asin,
          metric.unique_identifier,
          metric.targeted_keyword,
          metric.keyword,
        ];
        return fieldsToSearch.some((fieldValue) =>
          (fieldValue || '').toLowerCase().includes(searchTermLower),
        );
      });
    },
    [],
  );

  /**
   * Initializes an AggregatedProductMetrics object with default values.
   * @param id The unique identifier for the product.
   * @returns An initialized AggregatedProductMetrics object.
   */
  const initializeAggregatedMetric = (
    id: string,
  ): AggregatedProductMetrics => ({
    unique_identifier: id,
    total_sales: 0,
    ad_sales: 0,
    acos: 0,
    profit: 0,
    inventory_level: 0,
    count: 0,
    total_ad_spend: 0,
    total_ad_sales: 0,
  });

  /**
   * Calculates final derived metrics for an AggregatedProductMetrics item.
   * @param item The AggregatedProductMetrics item to finalize.
   * @returns The finalized AggregatedProductMetrics object.
   */
  const calculateFinalProductMetrics = (
    item: AggregatedProductMetrics,
  ): AggregatedProductMetrics => ({
    ...item,
    acos:
      item.total_ad_sales > 0
        ? (item.total_ad_spend / item.total_ad_sales) * 100
        : 0,
    inventory_level: item.count > 0 ? item.inventory_level / item.count : 0,
  });

  /**
   * Aggregates product-level metrics from a filtered list of DashboardMetrics.
   * @param filteredMetrics The array of DashboardMetrics to aggregate.
   * @returns An array of AggregatedProductMetrics.
   */
  const aggregateProductMetrics = useCallback(
    (filteredMetrics: DashboardMetrics[]) => {
      const aggregatedData: { [key: string]: AggregatedProductMetrics } = {};

      filteredMetrics.forEach((metric) => {
        const id = metric.unique_identifier;
        if (!id) return;

        if (!aggregatedData[id]) {
          aggregatedData[id] = initializeAggregatedMetric(id);
        }

        const currentAgg = aggregatedData[id];
        currentAgg.total_sales += metric.total_sales || 0;
        currentAgg.ad_sales += metric.ad_sales || 0;
        currentAgg.total_ad_spend += metric.ad_spend || 0;
        currentAgg.total_ad_sales += metric.ad_sales || 0;
        currentAgg.profit += metric.profit || 0;
        currentAgg.inventory_level += metric.inventory_level || 0;
        currentAgg.count++;
      });

      return Object.values(aggregatedData).map(calculateFinalProductMetrics);
    },
    [],
  );

  // Memoized product performance data based on current metrics and search term
  const productPerformanceData = useMemo(() => {
    if (metrics.length === 0) {
      return [];
    }
    const filtered = filterMetricsBySearchTerm(metrics, searchTerm);
    return aggregateProductMetrics(filtered);
  }, [metrics, searchTerm, filterMetricsBySearchTerm, aggregateProductMetrics]);

  // Memoized configuration for product performance table columns
  const productPerformanceTableColumns = useMemo(
    () => [
      {
        accessorKey: 'unique_identifier',
        header: 'ASIN/SKU',
        copyable: true,
        analyzeInTool: { toolName: 'competition', paramName: 'asin' },
      },
      { accessorKey: 'total_sales', header: 'Total Sales' },
      { accessorKey: 'ad_sales', header: 'Ad Sales' },
      { accessorKey: 'acos', header: 'ACoS' },
      { accessorKey: 'profit', header: 'Profit' },
      { accessorKey: 'inventory_level', header: 'Inventory Level' },
    ],
    [],
  );

  // Memoized accessor for product performance table row IDs
  const productPerformanceRowIdAccessor = useCallback(
    (row: AggregatedProductMetrics) => row.unique_identifier,
    [],
  );

  return {
    metrics,
    isLoading,
    isParsing,
    error,
    searchTerm,
    timeGranularity,
    timeRange,
    customDateRange,
    aggregatedAndSortedMetrics,
    productPerformanceData,
    productPerformanceTableColumns,
    productPerformanceRowIdAccessor,
    onDeleteMetric,
    onRefreshData: handleRefreshData,
    onLoadSampleData: handleLoadSampleData,
    onUploadFile: handleUploadFile,
    onDownloadSampleCsv: handleDownloadSampleCsv,
    fileInputRef,
    showMapper,
    csvHeaders,
    firstCsvDataRow,
    handleMappingComplete,
    handleMappingCancel,
    savedMapping,
    parsingErrors,
    isUploading,
    isMapping,
    isProcessing,
    totalRows: totalRowsRef.current,
    processedRows: processedRowsRef.current,
    setTimeGranularity,
    setTimeRange,
    setCustomDateRange,
    setSearchTerm,
    overviewDataMapperKey, // Expose for remounting mapper if needed
  };
};
