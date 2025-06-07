'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast.ts';
import useDebounce from '@/hooks/use-debounce.ts';

import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation';
import {
  transformCsvRow,
  TransformationError,
  CsvRowTransformationResult,
} from '@/lib/utils/amazon/data-transformation';
import { SAMPLE_CHART_DATA } from '@/data/amazon-tools-sample-data/amazon-dashboard-sample-data';
import {
  INDEXED_DB_OVERVIEW_TAB_SELECTED_METRICS_KEY,
  INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY,
} from '@/lib/constants';
import { getItem, setItem } from '@/lib/indexeddb-service';
import type { CsvColumnMapping } from '@/types/data-mapping';
import {
  DashboardMetrics,
  DashboardViewPreferences,
  TimeRange,
  TargetMetricConfig,
  AggregatedProductMetrics,
} from '@/lib/amazon-tools/types';
import { TARGET_METRICS_CONFIG } from '@/config/amazon-tools-config'; // Import TARGET_METRICS_CONFIG

/**
 * Interface for props that DataIntegrationTab will expose to its parent.
 */
export interface DataIntegrationTabProps {
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
  onDownloadSampleCsv: () => Promise<void>; // Updated to return Promise<void>
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
}

/**
 * `DataIntegrationTab` is responsible for handling all data loading, parsing,
 * transformation, and state management for the Amazon Seller Tools dashboard.
 * It acts as the exclusive data source, providing processed metrics and
 * related states/callbacks to its parent component.
 *
 * @returns {JSX.Element} The Data Integration tab content, including data upload/mapping UI.
 */
const DataIntegrationTab: React.FC<
  Partial<DataIntegrationTabProps> & {
    onDataUpdate: (data: {
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
      productPerformanceRowIdAccessor: (
        row: AggregatedProductMetrics,
      ) => string;
      onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void;
      onRefreshData: () => void;
      onLoadSampleData: () => void;
      onUploadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
      onDownloadSampleCsv: () => Promise<void>; // Updated to return Promise<void>
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
    }) => void;
  }
> = ({ onDataUpdate }) => {
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

  const debouncedTimeRange = useDebounce(timeRange, 500);
  const debouncedTimeGranularity = useDebounce(timeGranularity, 500);
  const debouncedCustomDateRange = useDebounce(customDateRange, 500);

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

  const handleRefreshData = useCallback(async () => {
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]);
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsLoading(true);
    totalRowsRef.current = 0;
    processedRowsRef.current = 0;
    setTimeGranularity('daily');
    setTimeRange('custom');
    setCustomDateRange({ from: undefined, to: undefined });
    await setItem(INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY, null);

    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    await setItem('last_csv_mapping', null);
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

    setTimeRange('custom');
    setCustomDateRange({ from: undefined, to: undefined });

    toast({
      title: 'Sample Data Loaded',
      description: `Loaded ${SAMPLE_CHART_DATA.length} rows of sample data.`,
      variant: 'success',
      duration: 3000,
    });

    setTimeout(() => setIsLoading(false), 500);
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
      setSelectedFile(null);
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
        preview: 2,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          const headers = results.meta.fields;
          const sampleRow = results.data[0] as
            | Record<string, string>
            | undefined;
          if (!headers || headers.length === 0) {
            setError('Could not read headers from the CSV file. Is it valid?');
            toast({
              title: 'Upload Failed',
              description:
                'Could not read headers from the CSV file. Is it valid?',
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
          setSelectedFile(file);
          setShowMapper(true);
          setIsParsing(false);
          setIsUploading(false);
          setIsLoading(false);
          setIsMapping(true);
          toast({
            title: 'CSV Uploaded Successfully',
            description: 'Now mapping your data columns.',
            variant: 'success',
            duration: 3000,
          });
        },
        error: (error: Error) => {
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
      });
    },
    [
      toast,
      setError,
      setParsingErrors,
      setMetrics,
      setShowMapper,
      setCsvHeaders,
      setSelectedFile,
      setFirstCsvDataRow,
      setIsUploading,
      setIsParsing,
      setIsLoading,
      setIsMapping,
      setIsProcessing,
    ],
  );

  const handleMappingComplete = useCallback(
    async (mapping: CsvColumnMapping) => {
      const processCsvData = async (
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
              processedRowsRef.current = allRows.length;
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
      };

      const generateProcessingStatus = (
        validMetrics: DashboardMetrics[],
        totalRows: number,
        collectedErrors: TransformationError[],
      ): {
        message: string;
        variant: 'success' | 'warning' | 'destructive' | 'info';
        title: string;
      } => {
        let statusMessage = '';
        let toastVariant: 'success' | 'warning' | 'destructive' | 'info' =
          'info';
        let toastTitle = 'Data Processing Complete';

        if (validMetrics.length > 0) {
          statusMessage = `Successfully processed ${validMetrics.length} of ${totalRows} rows.`;
          toastVariant = 'success';
        } else {
          statusMessage = `No valid data extracted from ${totalRows} rows.`;
          toastVariant = 'warning';
        }

        const skippedRows = totalRows - validMetrics.length;
        if (skippedRows > 0) {
          statusMessage += ` ${skippedRows} row(s) were skipped due to critical errors.`;
          toastVariant = 'warning';
        }

        const errorCount = collectedErrors.filter(
          (e) => e.type === 'error',
        ).length;
        const warningCount = collectedErrors.filter(
          (e) => e.type === 'warning',
        ).length;

        if (errorCount > 0) {
          statusMessage += ` Found ${errorCount} transformation error(s).`;
          toastVariant = 'destructive';
          toastTitle = 'Data Processing with Errors';
        }
        if (warningCount > 0) {
          statusMessage += ` Found ${warningCount} warning(s).`;
          if (toastVariant !== 'destructive') {
            toastVariant = 'warning';
            toastTitle = 'Data Processing with Warnings';
          }
        }

        return {
          message: statusMessage,
          variant: toastVariant,
          title: toastTitle,
        };
      };

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

        await setItem('last_csv_mapping', mapping);
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
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
    ],
  );

  const handleMappingCancel = useCallback(() => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]);
    setOverviewDataMapperKey((prev) => prev + 1);
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

  const dailySortedMetrics = useMemo(
    () =>
      [...metrics].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }

        return dateA.getTime() - dateB.getTime();
      }),
    [metrics],
  );

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
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >=
              new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          );
          break;
        case 'last_30_days':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >=
              new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          );
          break;
        case 'month_to_date':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >= startOfMonth &&
              new Date(m.date) <= endOfMonth,
          );
          break;
        case 'year_to_date':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >= startOfYear && new Date(m.date) <= endOfYear,
          );
          break;
        case 'custom':
          if (customRange.from && customRange.to) {
            filtered = validDateMetrics.filter(
              (m) =>
                new Date(m.date) >= customRange.from! &&
                new Date(m.date) <= customRange.to!,
            );
          }
          break;
        case 'all_time':
        default:
          break;
      }
      return aggregateMetricsByTime(filtered, timeGranularity);
    },
    [timeGranularity],
  );

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

  const productPerformanceData = useMemo(() => {
    if (metrics.length === 0) {
      return [];
    }
    const filtered = filterMetricsBySearchTerm(metrics, searchTerm);
    return aggregateProductMetrics(filtered);
  }, [metrics, searchTerm, filterMetricsBySearchTerm, aggregateProductMetrics]);

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

  const productPerformanceRowIdAccessor = useCallback(
    (row: AggregatedProductMetrics) => row.unique_identifier,
    [],
  );

  // Effect to notify parent of data updates
  useEffect(() => {
    onDataUpdate({
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
    });
  }, [
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
    handleRefreshData,
    handleLoadSampleData,
    handleUploadFile,
    handleDownloadSampleCsv,
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
    onDataUpdate,
    setTimeGranularity,
    setTimeRange,
    setCustomDateRange,
    setSearchTerm,
  ]);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Data Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This section is now the central hub for all Amazon Seller Tools data.
          Upload your CSV files, map columns, and manage your data sources here.
        </p>
        <div className="border-dashed border-2 border-gray-300 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400 rounded-lg">
          <p className="mb-2">Data integration features are now active!</p>
          <p>Use the controls below to upload new data or load sample data.</p>
        </div>
        {/* Placeholder for data upload/mapping UI - will be implemented in a later step */}
        <div className="mt-4">
          {/* This is where the data upload/mapping UI will eventually go */}
          <p className="text-gray-700 dark:text-gray-300">
            Data upload and mapping controls will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataIntegrationTab;
