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
import Papa from 'papaparse';
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

// --- Constants ---
const REQUIRED_COLUMNS = ['keyword', 'date', 'search_volume'];
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

// --- Component ---
export default function KeywordTrendAnalyzer() {
  const { toast } = useToast();
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for manual input
  const [keyword, setKeyword] = useState<string>('');

  const handleAnalyze = useCallback(async () => {
    if (!keyword) {
      toast({
        title: 'Input Required',
        description: 'Please enter a keyword.',
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
        throw new Error(errorData.message || 'Failed to fetch keyword trends.');
      }
      const data: TrendDataPoint[] = await response.json();

      if (data.length === 0) {
        setError('No data found for the specified keyword.');
        toast({
          title: 'No Data',
          description:
            'No trend data found for this keyword. Try uploading a CSV first.',
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
        description: `Successfully fetched trend for "${keyword}".`,
        variant: 'success',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during analysis.';
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

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(undefined);
      setChartData([]); // Clear previous results
      setKeywords([]);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Enable dynamic typing for numeric values
        complete: async (result: Papa.ParseResult<TrendDataPoint>) => {
          try {
            // Log the start of processing
            console.info('Starting trend data processing', {
              fileName: file.name,
              rowCount: result.data.length,
            });

            if (result.errors.length > 0) {
              const errorMessage = `CSV parsing error: ${result.errors[0].message}. Check row ${result.errors[0].row}.`;
              console.error(errorMessage, {
                fileName: file.name,
                rowIndex: result.errors[0].row,
                error: result.errors[0],
              });
              throw new Error(errorMessage);
            }

            const actualHeaders =
              result.meta.fields?.map((h: string) => h.toLowerCase()) || [];
            const missingHeaders = REQUIRED_COLUMNS.filter(
              (header) => !actualHeaders.includes(header),
            );

            if (missingHeaders.length > 0) {
              const errorMessage = `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${actualHeaders.join(', ') || 'None'}`;
              console.error(errorMessage, {
                fileName: file.name,
                missingHeaders,
                foundHeaders: actualHeaders,
              });
              throw new Error(errorMessage);
            }

            if (result.data.length === 0) {
              const errorMessage =
                'The uploaded CSV file appears to be empty or contains no data rows.';
              console.warn(errorMessage, { fileName: file.name });
              throw new Error(errorMessage);
            }

            // Process the data using the KeywordTrendService
            const { chartData: processedData, keywords: foundKeywords } =
              await KeywordTrendService.analyzeTrends(result.data);

            if (processedData.length === 0) {
              const errorMessage =
                'No valid trend data found after processing. Please check your data format.';
              console.error(errorMessage, {
                fileName: file.name,
                rowCount: result.data.length,
              });
              throw new Error(errorMessage);
            }

            setChartData(processedData);
            setKeywords(foundKeywords);
            setError(undefined);

            toast({
              title: 'Analysis Complete',
              description: `Successfully analyzed trends for ${foundKeywords.length} keywords over ${processedData.length} dates.`,
              variant: 'success',
            });

            console.info('Trend analysis completed successfully', {
              fileName: file.name,
              keywordCount: foundKeywords.length,
              datePoints: processedData.length,
            });
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : 'An unknown error occurred during processing.';
            setError(message);
            setChartData([]);
            setKeywords([]);
            toast({
              title: 'Processing Failed',
              description: message,
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
            // Reset file input
            if (event.target) {
              event.target.value = '';
            }
          }
        },
        error: (err: Error) => {
          setError(`Error reading CSV file: ${err.message}`);
          setIsLoading(false);
          setChartData([]);
          setKeywords([]);
          toast({
            title: 'Upload Failed',
            description: `Error reading CSV file: ${err.message}`,
            variant: 'destructive',
          });
          // Reset file input on read error too
          if (event.target) {
            event.target.value = '';
          }
        },
      });
    },
    [toast],
  );

  const handleExport = useCallback(() => {
    if (chartData.length === 0) {
      const msg = 'No data to export.';
      setError(msg);
      toast({
        title: 'Export Error',
        description: msg,
        variant: 'warning',
      });
      return;
    }
    setError(undefined);

    // Export the processed chart data
    try {
      const csv = Papa.unparse(chartData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'keyword_trends_analysis.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
                    (Requires: {REQUIRED_COLUMNS.join(', ')})
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
