'use client';
import useDebounce from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import Papa from 'papaparse';
import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { Download } from 'lucide-react';

// Import newly extracted components
import { OverviewLoadingIndicator } from '@/components/amazon-seller-tools/overview/OverviewLoadingIndicator';
import { OverviewErrorDisplay } from '@/components/amazon-seller-tools/overview/OverviewErrorDisplay';
import { OverviewDataMapper } from '@/components/amazon-seller-tools/overview/OverviewDataMapper';
import { PlaceholderCard } from '@/components/amazon-seller-tools/overview/PlaceholderCard';
import { PlaceholderChartContainer } from '@/components/amazon-seller-tools/overview/PlaceholderChartContainer';
// Import newly extracted chart components and OverviewDataView
import { SalesTrendsChart } from '@/components/amazon-seller-tools/charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '@/components/amazon-seller-tools/charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '@/components/amazon-seller-tools/charts/OrdersSessionsChart';
import { AdSpendSalesChart } from '@/components/amazon-seller-tools/charts/AdSpendSalesChart';
import { ProfitTrendChart } from '@/components/amazon-seller-tools/charts/ProfitTrendChart';
import { OverviewDataView } from '@/components/amazon-seller-tools/overview/OverviewDataView';
import KeywordVsAdSalesDonutChart from '@/components/amazon-seller-tools/charts/KeywordVsAdSalesDonutChart';
import {
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
} from '@/config/amazon-tools-config';
import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation'; // Import aggregation utility
import {
  transformCsvRow,
  TransformationError, // Import TransformationError
  CsvRowTransformationResult, // Import CsvRowTransformationResult
} from '@/lib/utils/amazon/data-transformation'; // Import data transformation utilities
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import type { CsvColumnMapping } from '@/types/data-mapping';
import {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page';
import { getItem, setItem } from '@/lib/indexeddb-service'; // Import IndexedDB service
import DataCard from './DataCard';
import TableChart from '@/components/ui/TableChart';

// Define a new interface for aggregated product metrics
interface AggregatedProductMetrics {
  unique_identifier: string;
  total_sales: number;
  ad_sales: number;
  acos: number;
  profit: number;
  inventory_level: number;
  count: number;
  total_ad_spend: number;
  total_ad_sales: number;
}

interface OverviewTabProps {
  metrics: DashboardMetrics[];
  setMetrics: React.Dispatch<React.SetStateAction<DashboardMetrics[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isParsing: boolean;
  setIsParsing: React.Dispatch<React.SetStateAction<boolean>>;
  isUploading: boolean; // Prop indicating if parent considers it uploading
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>; // Setter from parent
  isMapping: boolean; // Prop indicating if parent considers it mapping
  setIsMapping: React.Dispatch<React.SetStateAction<boolean>>; // Setter from parent
  isProcessing: boolean; // Prop indicating if parent considers it processing
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>; // Setter from parent
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  TARGET_METRICS_CONFIG: TargetMetricConfig[];
  searchTerm: string; // Add searchTerm prop
}

const DESC_SAMPLE_DATA = 'Sample Data';

const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  setMetrics,
  isLoading,
  setIsLoading,
  isParsing,
  setIsParsing,
  error,
  setError,
  TARGET_METRICS_CONFIG,
  searchTerm, // Destructure searchTerm from props
  // Destructure isUploading, isMapping, isProcessing and their setters from props
  isUploading,
  setIsUploading,
  isMapping,
  setIsMapping,
  isProcessing,
  setIsProcessing,
}) => {
  const [showMapper, setShowMapper] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstCsvDataRow, setFirstCsvDataRow] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [timeGranularity, setTimeGranularity] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('daily');
  const [overviewDataMapperKey, setOverviewDataMapperKey] = useState(0);
  const [savedMapping, setSavedMapping] = useState<CsvColumnMapping | null>(
    null,
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [parsingErrors, setParsingErrors] = useState<TransformationError[]>([]); // New state for parsing errors
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalRowsRef = useRef(0); // Ref to store total rows from CSV
  const processedRowsRef = useRef(0); // Ref to store count of rows processed

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

  useEffect(() => {
    // Also load selectedMetrics from IndexedDB on component mount
    const loadSelectedMetrics = async () => {
      const storedSelectedMetrics = await getItem<string[]>('selectedMetrics');
      if (storedSelectedMetrics) {
        setSelectedMetrics(storedSelectedMetrics);
      }
    };
    loadSelectedMetrics();
  }, []);

  const handleRefresh = useCallback(async () => {
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]); // Clear parsing errors on refresh
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsLoading(true);
    totalRowsRef.current = 0; // Reset row counts
    processedRowsRef.current = 0; // Reset row counts
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    // Clear saved mapping on refresh
    await setItem('last_csv_mapping', null);
    setSavedMapping(null); // Also clear from state
  }, [
    setIsLoading,
    setError,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setMetrics,
    setOverviewDataMapperKey,
  ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true); // Start uploading indicator
    setIsParsing(true); // Start parsing indicator
    setError(null);
    setParsingErrors([]); // Clear previous errors
    setMetrics([]);
    setShowMapper(false); // Hide mapper initially
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setIsMapping(false); // Ensure mapping is false
    setIsProcessing(false); // Ensure processing is false
    totalRowsRef.current = 0; // Reset on new file selection
    processedRowsRef.current = 0; // Reset on new file selection

    Papa.parse<Record<string, string>>(file, {
      header: true,
      preview: 2,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const headers = results.meta.fields;
        const sampleRow = results.data[0] as Record<string, string> | undefined;
        if (!headers || headers.length === 0) {
          setError('Could not read headers from the CSV file. Is it valid?');
          setIsParsing(false);
          setIsUploading(false); // Fixed: Should be false after header parsing failure
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        setCsvHeaders(headers);
        setFirstCsvDataRow(sampleRow);
        setSelectedFile(file);
        setShowMapper(true); // Show mapper after parsing headers
        setIsParsing(false); // Parsing headers is complete
        setIsUploading(false); // Uploading is complete
        setIsMapping(true); // Now user is in mapping stage
      },
      error: (error: Error, file: File) => {
        // Corrected type signature
        setError(`Failed to read file headers: ${error.message}`);
        setIsParsing(false);
        setIsUploading(false); // Fixed: Should be false after file error
        setIsMapping(false); // Ensure mapping is false on error
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const processCsvData = async (
    file: File,
    mapping: CsvColumnMapping,
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
        step: (rowParseResult, parser) => {
          if (rowParseResult.data) {
            allRows.push(rowParseResult.data);
          }
          processedRowsRef.current = allRows.length; // Live update during step
        },
        complete: () => {
          totalRowsRef.current = allRows.length; // Final total rows count
          const validMetrics: DashboardMetrics[] = [];
          const collectedErrors: TransformationError[] = [];

          allRows.forEach((row, i) => {
            const result: CsvRowTransformationResult = transformCsvRow(
              row,
              mapping,
              i, // row number
              TARGET_METRICS_CONFIG,
            );
            if (result.data) {
              validMetrics.push(result.data);
            }
            collectedErrors.push(...result.errors);
          });
          resolve({ validMetrics, collectedErrors, totalRows: allRows.length });
        },
        error: (error: Error, file: File) => reject(error), // Corrected type signature
      });
    });
  };

  const handleMappingComplete = async (mapping: CsvColumnMapping) => {
    if (!selectedFile) {
      setError('No file selected for processing.');
      setShowMapper(false);
      setIsMapping(false); // Ensure mapping is false
      return;
    }

    setShowMapper(false); // Hide mapper
    setIsMapping(false); // Mapping is complete
    setIsProcessing(true); // Start processing indicator
    setError(null);
    setParsingErrors([]); // Clear previous errors
    setMetrics([]);
    totalRowsRef.current = 0; // Reset for actual processing parse
    processedRowsRef.current = 0; // Reset for actual processing parse

    try {
      const { validMetrics, collectedErrors, totalRows } = await processCsvData(
        selectedFile,
        mapping,
      );

      setMetrics(validMetrics);
      setParsingErrors(collectedErrors);
      totalRowsRef.current = totalRows; // Ensure ref is updated after complete parse

      let statusMessage = '';
      if (validMetrics.length > 0) {
        statusMessage = `Successfully processed ${validMetrics.length} of ${totalRows} rows.`;
      } else {
        statusMessage = `No valid data extracted from ${totalRows} rows.`;
      }

      const skippedRows = totalRows - validMetrics.length;
      if (skippedRows > 0) {
        statusMessage += ` ${skippedRows} row(s) were skipped due to critical errors.`;
      }
      if (collectedErrors.length > 0) {
        const errorCount = collectedErrors.filter(
          (e) => e.type === 'error',
        ).length;
        const warningCount = collectedErrors.filter(
          (e) => e.type === 'warning',
        ).length;
        if (errorCount > 0)
          statusMessage += ` Found ${errorCount} transformation error(s).`;
        if (warningCount > 0)
          statusMessage += ` Found ${warningCount} warning(s).`;
      }
      setError(statusMessage || null); // Display overall status/summary message

      console.log('Valid Metrics:', validMetrics);
      console.log('Collected Errors/Warnings:', collectedErrors);

      // Save the successful mapping to IndexedDB
      await setItem('last_csv_mapping', mapping);
      console.log('Mapping saved to IndexedDB.');
    } catch (err) {
      // General file parsing error before row-by-row transformation
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to parse file: ${errorMessage}`);
      setParsingErrors([
        {
          rowNumber: -1, // Indicates file-level error
          column: 'File',
          message: `General CSV parsing error: ${errorMessage}`,
          type: 'error',
        },
      ]);
    } finally {
      setIsProcessing(false); // Processing is complete
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      totalRowsRef.current = 0; // Clear after processing
      processedRowsRef.current = 0; // Clear after processing
    }
  };

  const handleMappingCancel = () => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]); // Clear errors on cancel
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Mapping cancelled.');
  };

  const handleDownloadSampleCsv = async () => {
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
  };

  const handleUploadClick = () => {
    setMetrics([]);
    setError(null);
    setParsingErrors([]); // Clear errors on new upload
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    totalRowsRef.current = 0; // Reset on new upload
    processedRowsRef.current = 0; // Reset on new upload
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

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
      [...metrics].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [metrics],
  );

  const aggregatedAndSortedMetrics = useMemo(
    () => aggregateMetricsByTime(dailySortedMetrics, timeGranularity),
    [dailySortedMetrics, timeGranularity],
  );

  const aggregatedTableMetricsConfig: TargetMetricConfig[] = useMemo(() => {
    const aggregatedKeys: (keyof DashboardMetrics)[] = [
      'date',
      'total_sales',
      'total_orders',
      'total_sessions',
      'ad_spend',
      'ad_sales',
      'acos',
      'roas',
      'profit',
      'ad_impressions',
      'ad_clicks',
      'total_conversion_rate',
    ];
    return TARGET_METRICS_CONFIG.filter((config) =>
      aggregatedKeys.includes(config.key),
    );
  }, [TARGET_METRICS_CONFIG]);

  useEffect(() => {
    console.log(
      'OverviewTab - aggregatedTableMetricsConfig:',
      JSON.stringify(aggregatedTableMetricsConfig, null, 2),
    );
  }, [aggregatedTableMetricsConfig]);

  // Extracted useMemo for product performance data to ensure consistent hook call order
  const productPerformanceData = useMemo(() => {
    if (metrics.length === 0) {
      return []; // Return empty array if no metrics
    }
    const aggregatedData: { [key: string]: AggregatedProductMetrics } = {};

    const filteredMetrics = metrics.filter((metric) => {
      const searchTermLower = searchTerm?.toLowerCase() || '';
      const asin = metric.asin?.toLowerCase() || '';
      const uniqueIdentifier = metric.unique_identifier?.toLowerCase() || '';
      const targetedKeyword = metric.targeted_keyword?.toLowerCase() || '';
      const keyword = metric.keyword?.toLowerCase() || '';

      return (
        asin.includes(searchTermLower) ||
        uniqueIdentifier.includes(searchTermLower) ||
        targetedKeyword.includes(searchTermLower) ||
        keyword.includes(searchTermLower)
      );
    });

    filteredMetrics.forEach((metric) => {
      const id = metric.unique_identifier;
      if (!id) return;

      if (!aggregatedData[id]) {
        aggregatedData[id] = {
          unique_identifier: id,
          total_sales: 0,
          ad_sales: 0,
          acos: 0,
          profit: 0,
          inventory_level: 0,
          count: 0,
          total_ad_spend: 0,
          total_ad_sales: 0,
        };
      }

      aggregatedData[id].total_sales += metric.total_sales || 0;
      aggregatedData[id].ad_sales += metric.ad_sales || 0;
      aggregatedData[id].total_ad_spend += metric.ad_spend || 0;
      aggregatedData[id].total_ad_sales += metric.ad_sales || 0;
      aggregatedData[id].profit += metric.profit || 0;
      aggregatedData[id].inventory_level += metric.inventory_level || 0;
      aggregatedData[id].count++;
    });

    return Object.values(aggregatedData).map(
      (item: AggregatedProductMetrics) => ({
        ...item,
        acos:
          item.total_ad_sales > 0
            ? (item.total_ad_spend / item.total_ad_sales) * 100
            : 0,
        inventory_level: item.count > 0 ? item.inventory_level / item.count : 0,
      }),
    );
  }, [metrics, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 border rounded-md bg-muted/40">
        <h4 className="text-lg font-medium mb-2">Load Overview Data</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Upload an Amazon Reports CSV to visualize your key metrics. You'll be
          asked to map the columns after uploading.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
          id="csvFileInput"
        />
        <Button onClick={handleUploadClick} disabled={isParsing || isLoading}>
          {isParsing ? 'Reading File...' : 'Choose Report File (.csv)'}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadSampleCsv}
          className="ml-2"
        >
          <Download className="mr-2 h-4 w-4" /> Download Sample CSV
        </Button>
      </div>
      {isUploading || isParsing || isProcessing ? (
        <OverviewLoadingIndicator
          isUploading={isUploading}
          isParsing={isParsing}
          isProcessing={isProcessing}
          showMapperText={showMapper}
          totalRows={totalRowsRef.current}
          processedRows={processedRowsRef.current}
          parsingErrorCount={parsingErrors.length}
        />
      ) : showMapper && csvHeaders.length > 0 ? (
        <OverviewDataMapper
          key={overviewDataMapperKey}
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onApplyMapping={handleMappingComplete}
          sampleDataRow={firstCsvDataRow}
          onCancel={handleMappingCancel}
          initialMapping={savedMapping || undefined}
        />
      ) : (error || parsingErrors.length > 0) &&
        !isLoading &&
        metrics.length === 0 ? (
        <OverviewErrorDisplay
          error={error}
          onRetryUpload={handleUploadClick}
          parsingErrors={parsingErrors} // Pass detailed parsing errors
        />
      ) : metrics.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {selectedMetrics.map((metric) => {
              const metricConfig = TARGET_METRICS_CONFIG.find(
                (config) => config.key === metric,
              );

              if (!metricConfig) {
                return null;
              }

              const metricValue =
                metrics.length > 0
                  ? metrics[metrics.length - 1][metricConfig.key]
                  : null;

              return (
                <PlaceholderCard
                  key={metricConfig.key}
                  title={metricConfig.label}
                  value={
                    metricValue !== null && typeof metricValue === 'number'
                      ? metricValue.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        })
                      : 'N/A'
                  }
                  description="Based on latest data"
                  colorClass="text-blue-400"
                />
              );
            })}
          </div>
          <OverviewDataView
            metrics={metrics}
            aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
            targetMetricsConfig={TARGET_METRICS_CONFIG}
            timeGranularity={timeGranularity}
            setTimeGranularity={setTimeGranularity}
            onDeleteMetric={onDeleteMetric}
          />
          <AddEventModal />{' '}
          {/* AddEventModal moved inside this conditional block */}
        </>
      ) : (
        // Default to placeholders if no metrics
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <PlaceholderChartContainer title="Sales Trends">
              <SalesTrendsChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Clicks & Impressions">
              <ClicksImpressionsChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Orders & Sessions">
              <OrdersSessionsChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Ad Spend vs. Ad Sales">
              <AdSpendSalesChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Profit Trend">
              <ProfitTrendChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
          </div>
          {/* Placeholder KPI Cards now above */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <PlaceholderCard
              title="Avg. Conversion Rate"
              value={SAMPLE_CARD_DATA.total_conversion_rate.toFixed(2)}
              unit="%"
              description={DESC_SAMPLE_DATA}
              colorClass="text-blue-400"
            />
            <PlaceholderCard
              title="Total Sales"
              value={SAMPLE_CARD_DATA.total_sales_sample.toLocaleString(
                undefined,
                { style: 'currency', currency: 'USD' },
              )}
              description={DESC_SAMPLE_DATA}
              colorClass="text-green-400"
            />
            <PlaceholderCard
              title="Avg. Clicks"
              value={SAMPLE_CARD_DATA.avg_clicks.toFixed(1)}
              description={DESC_SAMPLE_DATA}
              colorClass="text-yellow-400"
            />
          </div>
        </>
      )}

      {/* Product Performance Overview Table (Always rendered, data conditional) */}
      <div className="mb-4 p-4 border rounded-md bg-muted/40">
        <h4 className="text-lg font-medium mb-2">
          Product Performance Overview
        </h4>
        <TableChart
          columns={[
            { accessorKey: 'unique_identifier', header: 'ASIN/SKU' },
            { accessorKey: 'total_sales', header: 'Total Sales' },
            { accessorKey: 'ad_sales', header: 'Ad Sales' },
            { accessorKey: 'acos', header: 'ACoS' },
            { accessorKey: 'profit', header: 'Profit' },
            { accessorKey: 'inventory_level', header: 'Inventory Level' },
          ]}
          data={productPerformanceData}
        />
      </div>

      {/* Existing card below */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium text-primary dark:text-blue-300">
            While you're here, feel free to explore the other specialized tools
            available in the tabs above!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface AddEventModalProps {}
const AddEventModal: React.FC<AddEventModalProps> = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>
            Add event details to be displayed on the chart.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        {/* <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};
export default OverviewTab;
