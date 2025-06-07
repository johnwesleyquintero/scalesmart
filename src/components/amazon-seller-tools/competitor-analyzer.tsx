import { Card, Input } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/components/ui/use-mobile';
import { toast } from 'sonner'; // Use sonner for toasts
import { Info } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { setCacheItem, getCacheItem } from '@/lib/indexeddb-service';
import { cachedFetch } from '@/lib/api-cache';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip, // Alias Recharts Tooltip
} from 'recharts';
import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/sanitize';

// --- Interfaces & Types ---

/**
 * Interface for a raw CSV row before processing.
 */
interface CsvRow {
  asin: string;
  price: string;
  reviews: string;
  rating: string; // Changed to string to match raw CSV input
  conversion_rate: string;
  click_through_rate: string;
}

/**
 * Zod schema for validating raw CSV row data.
 */
const CsvRowSchema = z.object({
  asin: z.string().min(1, 'ASIN cannot be empty'),
  price: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Price must be a valid number',
  }),
  reviews: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Reviews must be a valid number',
  }),
  rating: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 5,
      {
        message: 'Rating must be a number between 0 and 5',
      },
    ),
  conversion_rate: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Conversion rate must be a valid number',
  }),
  click_through_rate: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Click through rate must be a valid number',
  }),
});

/**
 * Zod schema for a processed and validated row, with numeric types.
 */
const ProcessedRowSchema = z.object({
  asin: z.string(),
  price: z.number(),
  reviews: z.number(),
  rating: z.number(),
  conversion_rate: z.number(),
  click_through_rate: z.number(),
  niche: z.string().optional(), // Optional field for niche
});

/**
 * Type definition for a processed row.
 */
type ProcessedRow = z.infer<typeof ProcessedRowSchema>;

/**
 * Interface for a data point used in the chart.
 */
interface ChartDataPoint {
  name: string;
  [key: string]: number | string; // Allow string for 'name', numbers for metrics
}

/**
 * Union type for supported metrics.
 */
type MetricType =
  | 'price'
  | 'reviews'
  | 'rating'
  | 'conversion_rate'
  | 'click_through_rate';

/**
 * Interface for the API response from the competitor analysis endpoint.
 */
interface ApiResponse {
  competitors: string[];
  metrics: Record<MetricType, number[]>;
}

// --- Constants ---

const CHART_DATA_KEY = 'competitorAnalysis:chartData';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for IndexedDB cache

/**
 * Returns a consistent color for each metric type for chart visualization.
 * @param {MetricType} metric - The metric type.
 * @returns {string} The hexadecimal color code.
 */
const getChartColor = (metric: MetricType): string => {
  const colors: Record<MetricType, string> = {
    price: '#2563eb', // Blue
    reviews: '#16a34a', // Green
    rating: '#eab308', // Yellow
    conversion_rate: '#dc2626', // Red
    click_through_rate: '#9333ea', // Purple
  };
  return colors[metric];
};

/**
 * `CompetitorAnalyzer` component allows users to upload CSV data or enter an ASIN
 * to analyze and compare competitor metrics. It visualizes the data using a line chart.
 *
 * @param {object} props - The component props.
 * @param {string | null | undefined} props.initialAsin - An optional initial ASIN from URL parameters.
 * @returns {JSX.Element} The Competitor Analyzer UI.
 */
export function CompetitorAnalyzer({
  initialAsin,
}: {
  initialAsin?: string | null;
}) {
  const [asin, setAsin] = useState('');
  const [metrics, setMetrics] = useState<MetricType[]>([
    'price',
    'reviews',
    'rating',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sellerData, setSellerData] = useState<ProcessedRow[] | null>(null);
  const [competitorData, setCompetitorData] = useState<ProcessedRow[] | null>(
    null,
  );
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null);
  const [cacheDuration, setCacheDuration] = useState<number>(1); // Default cache duration in hours
  const isMobile = useIsMobile();

  // Effect to set initial ASIN if provided from URL params
  useEffect(() => {
    if (initialAsin && initialAsin.trim() !== '') {
      setAsin(initialAsin);
      // Optionally trigger analysis directly if desired, but generally better to let user initiate
      // analyzeCompetitor();
    }
  }, [initialAsin]);

  // Effect to load cached analysis data on component mount
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const cachedAnalysis = (await getCacheItem(CHART_DATA_KEY)) as {
          timestamp: number;
          chartData: ChartDataPoint[];
          asin: string;
          metrics: MetricType[];
        } | null;

        if (cachedAnalysis && cachedAnalysis.timestamp) {
          const now = Date.now();
          const cacheTime = cacheDuration * 60 * 60 * 1000; // Convert hours to milliseconds

          if (now - cachedAnalysis.timestamp > cacheTime) {
            logger.warn(
              'Cached competitor analysis data is stale, clearing cache.',
              { key: CHART_DATA_KEY },
            );
            await setCacheItem(CHART_DATA_KEY, null); // Clear stale cache
            setChartData(null);
          } else {
            setChartData(cachedAnalysis.chartData);
            setAsin(cachedAnalysis.asin);
            setMetrics(cachedAnalysis.metrics);
            toast.info('Loaded analysis from cache.');
          }
        }
      } catch (e) {
        logger.error('Error loading competitor analysis from IndexedDB:', {
          error: e,
        });
        toast.error('Failed to load cached analysis.');
      }
    };
    loadAnalysis();
  }, [cacheDuration]);

  /**
   * Processes a single raw CSV row, converting string values to numbers and validating.
   * @param {CsvRow} row - The raw CSV row.
   * @returns {ProcessedRow} The processed and validated row.
   * @throws {Error} If validation fails.
   */
  const processAndValidateRow = useCallback((row: CsvRow): ProcessedRow => {
    const parsed = CsvRowSchema.parse(row); // Validate raw string inputs first
    return ProcessedRowSchema.parse({
      // Then transform to numbers and validate the final structure
      asin: parsed.asin,
      price: Number(parsed.price),
      reviews: Number(parsed.reviews),
      rating: Number(parsed.rating),
      conversion_rate: Number(parsed.conversion_rate),
      click_through_rate: Number(parsed.click_through_rate),
      // niche is optional and not in CsvRow, so it's not mapped here.
      // If it were in CsvRow, it would be mapped like other fields.
    });
  }, []);

  /**
   * Handles the file upload for CSV data (seller or competitor).
   * Parses the CSV, validates rows, and updates the corresponding state.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   * @param {React.Dispatch<React.SetStateAction<ProcessedRow[] | null>>} setData - The state setter for the data.
   */
  const processCsvFile = useCallback(
    (
      file: File,
      setData: React.Dispatch<React.SetStateAction<ProcessedRow[] | null>>,
    ) => {
      setIsLoading(true);
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const csvData = e.target?.result as string;
        Papa.parse<CsvRow>(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const validRows: ProcessedRow[] = [];
            const errors: string[] = [];

            results.data.forEach((row, index) => {
              try {
                const processedRow = processAndValidateRow(row);
                validRows.push(processedRow);
              } catch (error) {
                if (error instanceof z.ZodError) {
                  const issueMessages = error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(', ');
                  errors.push(`Row ${index + 2}: ${issueMessages}`); // +2 for header and 0-based index
                } else if (error instanceof Error) {
                  errors.push(`Row ${index + 2}: ${error.message}`);
                } else {
                  errors.push(`Row ${index + 2}: An unknown error occurred.`);
                }
              }
            });

            setData(validRows.length > 0 ? validRows : null);
            setIsLoading(false);

            if (errors.length > 0) {
              toast.warning(
                `Processed with warnings. ${errors.length} rows had issues. First error: ${errors[0]}`,
                { duration: 5000 },
              );
              logger.warn('CSV parsing errors:', { errors });
            } else if (validRows.length > 0) {
              toast.success(
                `${file.name} uploaded and processed successfully.`,
              );
            } else {
              toast.info('CSV file processed, but no valid data found.');
            }
          },
          error: (error: Error) => {
            logger.error('CSV parsing error:', { error: error.message });
            toast.error(`Failed to parse CSV file: ${error.message}`);
            setIsLoading(false);
          },
        });
      };

      reader.onerror = () => {
        logger.error('FileReader error:', { error: reader.error });
        toast.error('Failed to read file.');
        setIsLoading(false);
      };

      reader.readAsText(file);
    },
    [processAndValidateRow],
  );

  const handleFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      setData: React.Dispatch<React.SetStateAction<ProcessedRow[] | null>>,
    ) => {
      const file = event.target.files?.[0];
      if (!file) {
        toast.error('No file selected.');
        return;
      }

      if (!file.name.endsWith('.csv')) {
        toast.error('Only CSV files are supported.');
        return;
      }

      processCsvFile(file, setData);
    },
    [processCsvFile],
  );

  /**
   * Transforms the uploaded CSV data into a format suitable for the chart.
   * @param {ProcessedRow[] | null} data - The processed CSV data.
   * @returns {ChartDataPoint[]} Formatted data for the chart.
   */
  const transformCsvToChartData = useCallback(
    (data: ProcessedRow[] | null): ChartDataPoint[] => {
      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => {
        const name = sanitizeHtml(row.asin || row.niche || 'N/A');
        const dataPoint: ChartDataPoint = { name };

        metrics.forEach((metric) => {
          const value = row[metric];
          if (typeof value === 'number' && !isNaN(value)) {
            dataPoint[metric] = value;
          } else {
            dataPoint[metric] = 0; // Default to 0 if value is missing or invalid
          }
        });
        return dataPoint;
      });
    },
    [metrics],
  );

  /**
   * Fetches competitor analysis data from the API based on the ASIN.
   * @returns {Promise<void>}
   */
  const fetchAndProcessApiData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await cachedFetch('/api/amazon/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asin: sanitizeHtml(asin),
          metrics,
          // Pass uploaded CSV data to API if it's meant to be combined or used server-side
          sellerData: sellerData,
          competitorData: competitorData,
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        logger.error('API Error: Failed to fetch competitor data', {
          status: response.status,
          error: errorDetail,
        });
        throw new Error(
          `Failed to fetch competitor data: ${response.statusText} - ${errorDetail}`,
        );
      }

      const data: ApiResponse = await response.json();

      // Basic validation of API response structure
      if (!data || !Array.isArray(data.competitors) || !data.metrics) {
        logger.error('Invalid API response format', { response: data });
        throw new Error('Invalid response format from server.');
      }

      // Sanitize and validate API response data
      const formattedData: ChartDataPoint[] = data.competitors.map(
        (competitor, index) => {
          const dataPoint: ChartDataPoint = { name: sanitizeHtml(competitor) };
          metrics.forEach((metric) => {
            const value = data.metrics[metric]?.[index];
            dataPoint[metric] =
              typeof value === 'number' && !isNaN(value) ? value : 0;
          });
          return dataPoint;
        },
      );

      if (formattedData.length === 0 || metrics.length === 0) {
        throw new Error(
          'No valid data or metrics available from API to render.',
        );
      }

      setChartData(formattedData);
      toast.success('Competitor data fetched successfully.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      logger.error('Error fetching and processing API data:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error(`Analysis failed: ${errorMessage}`);
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [asin, metrics, sellerData, competitorData]);

  /**
   * Handles processing of uploaded CSV data.
   * @returns {Promise<void>}
   */
  const processCsvData = useCallback(async (): Promise<void> => {
    const combinedData = [...(sellerData || []), ...(competitorData || [])];
    if (combinedData.length > 0) {
      const transformedData = transformCsvToChartData(combinedData);
      if (transformedData.length > 0) {
        setChartData(transformedData);
        toast.success('CSV data processed successfully.');
      } else {
        toast.info('No valid data to display from uploaded CSVs.');
      }
    } else {
      toast.error('No valid CSV data uploaded.');
    }
  }, [sellerData, competitorData, transformCsvToChartData]);

  /**
   * Handles the main analysis trigger.
   * Determines whether to use uploaded CSV data or fetch from API.
   */
  const analyzeCompetitor = useCallback(async () => {
    setIsLoading(true);
    setChartData(null); // Clear previous chart data

    try {
      if (sellerData || competitorData) {
        await processCsvData();
      } else if (asin.trim()) {
        await fetchAndProcessApiData();
      } else {
        toast.error('Please upload CSV files or enter an ASIN to analyze.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    asin,
    sellerData,
    competitorData,
    processCsvData,
    fetchAndProcessApiData,
  ]);

  /**
   * Saves the current analysis data to IndexedDB cache.
   * @param {ChartDataPoint[]} data - The chart data to save.
   * @param {string} currentAsin - The ASIN used for the analysis.
   * @param {MetricType[]} currentMetrics - The metrics selected for the analysis.
   */
  const saveAnalysisToCache = useCallback(
    async (
      data: ChartDataPoint[],
      currentAsin: string,
      currentMetrics: MetricType[],
    ) => {
      if (!data || data.length === 0) {
        toast.error('No analysis data to save.');
        return;
      }
      try {
        const dataToSave = {
          timestamp: Date.now(),
          chartData: data,
          asin: currentAsin,
          metrics: currentMetrics,
        };
        const dataSize = new Blob([JSON.stringify(dataToSave)]).size;
        if (dataSize <= MAX_STORAGE_SIZE) {
          await setCacheItem(CHART_DATA_KEY, dataToSave);
          toast.success('Analysis saved for future reference.');
        } else {
          logger.warn('Analysis data too large for cache, not saving.', {
            size: dataSize,
          });
          toast.warning('Analysis results are too large to save to cache.');
        }
      } catch (e) {
        logger.error('Error saving data to IndexedDB:', { error: e });
        toast.error('Failed to save analysis.');
      }
    },
    [], // Dependencies: none, as it uses constants and toast/logger
  );

  // Memoize the list of all available metrics for rendering checkboxes
  const allAvailableMetrics: MetricType[] = useMemo(
    () => [
      'price',
      'reviews',
      'rating',
      'conversion_rate',
      'click_through_rate',
    ],
    [],
  );

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">How it Works:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                Upload CSV files for your seller data and/or competitor data.
                Required columns: <code>asin</code>, <code>price</code>,{' '}
                <code>reviews</code>, <code>rating</code>,{' '}
                <code>conversion_rate</code>, <code>click_through_rate</code>.
              </li>
              <li>
                Alternatively, enter a single competitor ASIN to fetch data via
                API.
              </li>
              <li>Select the metrics you wish to compare.</li>
              <li>
                The tool will generate a trend chart visualizing the selected
                metrics across different products/competitors.
              </li>
              <li>
                Analysis results can be saved to your browser&apos;s cache.
              </li>
            </ul>
          </div>
        </div>

        <div
          className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}
        >
          {/* Seller Data Upload */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="seller-csv">Your Product Data (CSV)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Upload a CSV with columns: asin, price, reviews, rating,
                      conversion_rate, click_through_rate
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="seller-csv"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, setSellerData)}
              disabled={isLoading}
            />
            {sellerData && (
              <p className="text-sm text-muted-foreground mt-1">
                {sellerData.length} rows loaded for your product data.
              </p>
            )}
          </div>

          {/* Competitor Data Upload */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="competitor-csv">Competitor Data (CSV)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Upload a CSV with columns: asin, price, reviews, rating,
                      conversion_rate, click_through_rate
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="competitor-csv"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, setCompetitorData)}
              disabled={isLoading}
            />
            {competitorData && (
              <p className="text-sm text-muted-foreground mt-1">
                {competitorData.length} rows loaded for competitor data.
              </p>
            )}
          </div>
        </div>

        {/* ASIN Input */}
        <div className="space-y-2">
          <Label htmlFor="asin">Or Enter Competitor ASIN (for API fetch)</Label>
          <Input
            id="asin"
            value={asin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const inputValue = e.target.value;
              // Allow empty string for clearing the input
              if (inputValue === '') {
                setAsin('');
                return;
              }
              // ASINs are typically 10 alphanumeric characters.
              // Allow typing up to 10 characters, but validate format.
              if (inputValue.length <= 10 && /^[a-zA-Z0-9]*$/.test(inputValue)) {
                setAsin(inputValue);
              } else if (inputValue.length > 10) {
                toast.error('ASIN cannot exceed 10 characters.');
              } else {
                toast.error('ASIN must contain only alphanumeric characters.');
              }
            }}
            placeholder="e.g., B07XYZ1234"
            disabled={isLoading}
            maxLength={10} // Enforce max length for ASIN
            aria-label="Competitor ASIN"
            aria-describedby="asin-help-text"
          />
          <p className="text-sm text-muted-foreground">
            Enter a 10-character ASIN (letters and numbers) to fetch data via
            API.
          </p>
        </div>

        {/* Cache Duration */}
        <div>
          <Label htmlFor="cache-duration">Cache Duration (hours)</Label>
          <Input
            id="cache-duration"
            type="number"
            value={cacheDuration}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (!isNaN(value) && value >= 0) {
                setCacheDuration(value);
              }
            }}
            className="w-24"
            min="0"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Analysis results will be cached for this duration. Set to 0 to
            disable caching.
          </p>
        </div>

        {/* Metrics Selection */}
        <div>
          <Label htmlFor="metrics">Metrics to Compare</Label>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {allAvailableMetrics.map((metric) => (
              <div key={metric} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`metric-${metric}`}
                  checked={metrics.includes(metric)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMetrics((prev) => [...prev, metric]);
                    } else {
                      setMetrics((prev) => prev.filter((m) => m !== metric));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <Label htmlFor={`metric-${metric}`} className="capitalize">
                  {metric.replace(/_/g, ' ')}
                </Label>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMetrics(allAvailableMetrics)}
              disabled={isLoading}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMetrics([])}
              disabled={isLoading}
            >
              Deselect All
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={analyzeCompetitor}
            disabled={
              isLoading ||
              (asin.trim() === '' && !sellerData && !competitorData) ||
              metrics.length === 0
            }
          >
            {isLoading ? 'Analyzing...' : 'Analyze Competitor'}
          </Button>
          <Button
            variant="outline"
            disabled={!chartData || isLoading}
            onClick={async () => {
              if (!chartData) {
                toast.error('No analysis data to save.');
                return;
              }
              await saveAnalysisToCache(chartData, asin, metrics);
            }}
          >
            Save Analysis
          </Button>
        </div>

        {/* Chart Display */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Competitor Analysis Chart
          </h3>
          <div className="h-[400px] w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center">
            {isLoading ? (
              <p className="text-muted-foreground">Loading chart data...</p>
            ) : chartData && chartData.length > 0 && metrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="name"
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    tick={{
                      fontSize: isMobile ? 10 : 12,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                    height={isMobile ? 80 : 40}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fontSize: 12,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <RechartsTooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  {metrics.map((metric) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={getChartColor(metric)}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Upload data or enter an ASIN and select metrics to view the
                chart.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
