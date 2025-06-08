'use client';

import { useToast } from '@/hooks/use-toast.ts';
import { type TrendDataPoint } from '@/lib/amazon-tools/keyword-trend-service';
import {
  AlertCircle,
  Download,
  FileText,
  Info as InfoIcon,
  Loader2,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Local/UI Imports (Consistent with other tools)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { KeywordTrendService } from '@/lib/amazon-tools/keyword-trend-service';
import DataCard from './DataCard';

// Utility Imports
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import { exportToCSV, type ExportData } from '@/lib/amazon-tools/export-utils'; // Import ExportData type
import {
  keywordTrendHeaders,
  validateKeywordTrendRow,
  KeywordTrendCsvRow,
} from '@/lib/hooks/use-keyword-trend-validator';

// --- Constants ---
// Simple color palette for chart lines
const LINE_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#ff8042',
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#d0ed57',
];

/**
 * Message displayed when there is no data available for export.
 * This constant prevents duplication of the literal string across the codebase.
 */
const NO_DATA_MESSAGE = 'No data to export.';

/**
 * Message displayed when the uploaded CSV file is empty or has no data rows.
 */
const EMPTY_OR_NO_DATA_MESSAGE =
  'The uploaded CSV file appears to be empty or contains no data rows.';

/**
 * Prefix for the message indicating no valid data was found after initial parsing.
 */
const NO_VALID_DATA_PREFIX =
  'No valid data found in the CSV after initial parsing.';

/**
 * Suffix for the message indicating how many rows were skipped during initial parsing.
 */
const ROWS_SKIPPED_SUFFIX = 'rows were skipped.';

/**
 * Message displayed when no valid trend data is found after processing.
 */
const NO_VALID_TREND_DATA_MESSAGE =
  'No valid trend data found after processing. Please check your data format.';

/**
 * Prefix for the message indicating successful trend analysis.
 */
const SUCCESS_ANALYSIS_PREFIX = 'Successfully analyzed trends for';

/**
 * Suffix for the message indicating the number of keywords and dates analyzed.
 */
const KEYWORDS_OVER_DATES_SUFFIX = 'keywords over';

/**
 * Suffix for the message indicating the number of dates analyzed.
 */
const DATES_SUFFIX = 'dates.';

/**
 * Message displayed when the keyword input is empty.
 */
const KEYWORD_INPUT_REQUIRED_MESSAGE = 'Please enter a keyword.';

/**
 * Default error message when fetching keyword trends fails.
 */
const FETCH_TRENDS_FAILED_MESSAGE = 'Failed to fetch keyword trends.';

/**
 * Message displayed when no data is found for a manually entered keyword.
 */
const NO_KEYWORD_DATA_MESSAGE = 'No data found for the specified keyword.';

/**
 * Toast description when no trend data is found for a manually entered keyword.
 */
const NO_KEYWORD_TREND_DATA_DESCRIPTION =
  'No trend data found for this keyword. Try uploading a CSV first.';

/**
 * Prefix for the message indicating successful fetching of keyword trend data.
 */
const SUCCESS_FETCH_TREND_PREFIX = 'Successfully fetched trend for';

/**
 * Suffix for the message indicating successful fetching of keyword trend data.
 */
const SUCCESS_FETCH_TREND_SUFFIX = '.';

/**
 * Default error message for unknown errors during manual keyword analysis.
 */
const UNKNOWN_ANALYSIS_ERROR_MESSAGE =
  'An unknown error occurred during analysis.';

/**
 * Title for toast notifications indicating a processing failure.
 */
const PROCESSING_FAILED_TITLE = 'Processing Failed';

// --- Component ---
export default function KeywordTrendAnalyzer() {
  const { toast } = useToast();
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined | null>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for manual input keyword
  const [keyword, setKeyword] = useState<string>('');

  /**
   * CSV parser instance using the custom hook.
   * It handles parsing, initial row validation, and provides callbacks for success/error.
   * @param {object} config - Configuration for the CSV parser, including required headers and row validation.
   * @param {function} onError - Callback function for parsing errors.
   * @param {function} onSuccess - Callback function for successful parsing and data processing.
   */
  const csvParser = useCsvParser<KeywordTrendCsvRow>(
    {
      requiredHeaders: keywordTrendHeaders.required,
      validateRow: (row) =>
        validateKeywordTrendRow(row as Record<string, string>, 0),
    },
    (parseError: Error) => {
      setError(null); // Clear previous error
      setIsLoading(false);
      toast({
        title: 'CSV Parsing Error',
        description: parseError.message,
        variant: 'destructive',
      });
    },
    async (result: {
      data: KeywordTrendCsvRow[];
      skippedRows: Array<{ index: number; reason: string }>;
    }) => {
      if (result.data.length === 0) {
        const msg =
          result.skippedRows.length > 0
            ? `${NO_VALID_DATA_PREFIX} ${result.skippedRows.length} ${ROWS_SKIPPED_SUFFIX}`
            : EMPTY_OR_NO_DATA_MESSAGE;
        setError(msg);
        setIsLoading(false);
        toast({
          title: PROCESSING_FAILED_TITLE,
          description: msg,
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        return;
      }

      try {
        // Process the data using the KeywordTrendService
        const { chartData: processedData, keywords: foundKeywords } =
          await KeywordTrendService.analyzeTrends(result.data);

        if (processedData.length === 0) {
          const msg = NO_VALID_TREND_DATA_MESSAGE;
          setError(msg);
          toast({
            title: PROCESSING_FAILED_TITLE,
            description: msg,
            variant: 'destructive',
          });
        } else {
          setChartData(processedData);
          setKeywords(foundKeywords);
          setError(undefined);
          const processedMessage = `${SUCCESS_ANALYSIS_PREFIX} ${foundKeywords.length} ${KEYWORDS_OVER_DATES_SUFFIX} ${processedData.length} ${DATES_SUFFIX}`;
          const skippedMessage =
            result.skippedRows.length > 0
              ? ` Skipped ${result.skippedRows.length} invalid rows.`
              : '';
          toast({
            title: 'Analysis Complete',
            description: `${processedMessage}${skippedMessage}`,
            variant: 'success',
          });
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred during processing.';
        setError(message);
        setChartData([]);
        setKeywords([]);
        toast({
          title: PROCESSING_FAILED_TITLE,
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      }
    },
  );

  /**
   * Handles the analysis of a manually entered keyword.
   * Fetches trend data from the API and updates the chart and keyword states.
   * Displays toast notifications for success, no data, or errors.
   */
  const handleAnalyze = useCallback(async () => {
    if (!keyword) {
      toast({
        title: 'Input Required',
        description: KEYWORD_INPUT_REQUIRED_MESSAGE,
        variant: 'warning',
      });
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setChartData([]);
    setKeywords([]);

    try {
      const response = await fetch(
        `/api/amazon/keyword-trends?keyword=${encodeURIComponent(keyword)}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || FETCH_TRENDS_FAILED_MESSAGE);
      }
      const data: TrendDataPoint[] = await response.json();

      if (data.length === 0) {
        setError(NO_KEYWORD_DATA_MESSAGE);
        toast({
          title: 'No Data',
          description: NO_KEYWORD_TREND_DATA_DESCRIPTION,
          variant: 'info',
        });
        return;
      }

      // Extract unique keywords from the fetched data for chart lines
      const foundKeywords = Array.from(
        new Set(
          data.flatMap((item) =>
            Object.keys(item).filter((key) => key !== 'date'),
          ),
        ),
      );

      setChartData(data);
      setKeywords(foundKeywords);
      setError(undefined);

      toast({
        title: 'Analysis Complete',
        description: `${SUCCESS_FETCH_TREND_PREFIX} "${keyword}"${SUCCESS_FETCH_TREND_SUFFIX}`,
        variant: 'success',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : UNKNOWN_ANALYSIS_ERROR_MESSAGE;
      setError(message);
      setChartData([]);
      setKeywords([]);
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [keyword, toast]);

  /**
   * Handles the file upload event for CSV files.
   * Initiates the CSV parsing process and updates loading/error states.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setError('No file selected.');
        return;
      }

      setIsLoading(true);
      setError(undefined);
      setChartData([]);
      setKeywords([]);

      csvParser.parseFile(file).catch((err) => {
        // Error is already handled by csvParser's error callback, but catch here for completeness
        console.error('File parsing initiation failed:', err);
      });
    },
    [csvParser],
  );

  /**
   * Handles the export of chart data to a CSV file.
   * Maps the internal `TrendDataPoint` array to a generic `ExportData` format
   * and uses `exportToCSV` utility. Displays toast notifications for success or failure.
   */
  const handleExport = useCallback(() => {
    if (chartData.length === 0) {
      const msg = NO_DATA_MESSAGE;
      setError(msg);
      toast({
        title: 'Export Error',
        description: msg,
        variant: 'warning',
      });
      return;
    }
    setError(undefined);

    // Map TrendDataPoint[] to ExportData[] for generic CSV export.
    // This ensures that all properties of each TrendDataPoint are included in the export,
    // and values are converted to string, number, boolean, null, or undefined as required by ExportData.
    const exportableData: ExportData[] = chartData.map((item) => {
      const exportItem: ExportData = {};
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const value = item[key as keyof TrendDataPoint];
          // Ensure value is compatible with ExportData.
          // TrendDataPoint typically contains string (date) and number (search_volume) values.
          // The explicit checks here ensure robustness for the ExportData type,
          // which is more general and can handle boolean, null, or undefined.
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null ||
            value === undefined
          ) {
            exportItem[key] = value;
          } else {
            // Fallback for other types, converting them to string.
            // This might be useful if TrendDataPoint were to include complex objects in the future.
            exportItem[key] = String(value);
          }
        }
      }
      return exportItem;
    });

    try {
      exportToCSV(exportableData, 'keyword_trends_analysis.csv');
      toast({
        title: 'Export Successful',
        description: 'Keyword trend analysis exported to CSV.',
        variant: 'success',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to export data: ${message}`);
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [chartData, toast]);

  /**
   * Clears all loaded chart data, keywords, and error messages.
   * Resets the file input field and displays a toast notification.
   */
  const clearData = useCallback(() => {
    setChartData([]);
    setKeywords([]);
    setError(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All trend analysis results have been removed.',
      variant: 'info',
    });
  }, [toast]);

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How it Works:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Upload a CSV with columns: `keyword`, `date` (YYYY-MM-DD),
              `search_volume`.
            </li>
            <li>
              Each row represents the search volume for a specific keyword on a
              specific date.
            </li>
            <li>
              The tool visualizes the search volume trends for each keyword over
              time.
            </li>
            <li>(Note: Data processing is mocked for this demo).</li>
            <li>Export the processed trend data.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Upload Keyword Trend Data
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Analyze search volume trends from a CSV file
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="w-full max-w-md">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click or drag CSV file here
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    (Requires: {keywordTrendHeaders.required.join(', ')})
                  </span>
                  <input
                    type="file"
                    accept=".csv, text/csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    ref={fileInputRef}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Manual Keyword Trend Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Enter a keyword to analyze its search trend over time.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="w-full space-y-4">
                <div>
                  <Label
                    htmlFor="keyword-input"
                    className="text-sm font-medium"
                  >
                    Keyword
                  </Label>
                  <Input
                    id="keyword-input"
                    type="text"
                    placeholder="e.g., 'garlic press'"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Trend'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons (Export/Clear) */}
      {chartData.length > 0 && !isLoading && (
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-grow break-words">{error}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setError(undefined)}
            className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing trends...</p>
        </div>
      )}

      {/* Results Section */}
      {chartData.length > 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Keyword Trend Analysis ({keywords.length} Keywords)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Visualizing search volume trends over time.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[450px] w-full">
              {' '}
              {/* Ensure container has height */}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10, // Adjusted margin
                    left: 0, // Adjusted margin
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    // Consider adding angle={-30} textAnchor="end" height={50} if dates overlap
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    label={{
                      value: 'Search Volume',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 12 },
                      dx: -5,
                    }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', padding: '5px 10px' }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(), // Format number
                      name, // Keyword name
                    ]}
                    labelFormatter={(label: string) => `Date: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                  {keywords.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={LINE_COLORS[index % LINE_COLORS.length]} // Cycle through colors
                      strokeWidth={2}
                      dot={false} // Hide dots for cleaner lines with many points
                      name={key} // Use keyword as the legend name
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
