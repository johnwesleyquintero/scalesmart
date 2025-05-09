import { useIsMobile } from '@/app/hooks/use-mobile';
import { Card, Input } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { Info } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface CsvRow {
  asin: string;
  price: string;
  reviews: string;
  rating: number;
  conversion_rate: string;
  click_through_rate: string;
}

interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
  niche?: string;
}

export function validateAndProcessData(data: CsvRow[]): {
  validData: ProcessedRow[];
  errors: string[];
} {
  const validData: ProcessedRow[] = [];
  const errors: string[] = [];

  data.forEach((row, index) => {
    const {
      asin,
      price,
      reviews,
      rating,
      conversion_rate,
      click_through_rate,
    } = row;
    if (
      !asin ||
      !price ||
      !reviews ||
      !rating ||
      !conversion_rate ||
      !click_through_rate
    ) {
      errors.push(`Row ${index + 1}: Missing required fields`);
      return;
    }

    const parsedPrice = Number(price);
    const parsedReviews = Number(reviews);
    const parsedRating = Number(rating);
    const parsedConversionRate = Number(conversion_rate);
    const parsedClickThroughRate = Number(click_through_rate);

    if (
      isNaN(parsedPrice) ||
      isNaN(parsedReviews) ||
      isNaN(parsedRating) ||
      isNaN(parsedConversionRate) ||
      isNaN(parsedClickThroughRate)
    ) {
      errors.push(`Row ${index + 1}: Invalid numeric values`);
      return;
    }

    validData.push({
      asin,
      price: parsedPrice,
      reviews: parsedReviews,
      rating: parsedRating,
      conversion_rate: parsedConversionRate,
      click_through_rate: parsedClickThroughRate,
    });
  });

  return { validData, errors };
}

import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/sanitize';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

type MetricType =
  | 'price'
  | 'reviews'
  | 'rating'
  | 'conversion_rate'
  | 'click_through_rate';

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

const getChartColor = (metric: MetricType): string => {
  const colors: Record<MetricType, string> = {
    price: '#2563eb',
    reviews: '#16a34a',
    rating: '#eab308',
    conversion_rate: '#dc2626',
    click_through_rate: '#9333ea',
  };
  return colors[metric];
};

export function CompetitorAnalyzer() {
  const [asin, setAsin] = useState('');
  const [metrics, setMetrics] = useState<MetricType[]>([
    'price',
    'reviews',
    'rating',
  ]);

  const handleFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      setData: React.Dispatch<React.SetStateAction<ProcessedRow[] | null>>,
    ) => {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: 'Error',
          description: 'No file selected',
          variant: 'destructive',
        });
        return;
      }

      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Error',
          description: 'Only CSV files are supported',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const csvData = e.target?.result as string;
          Papa.parse<CsvRow>(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const { validData, errors } = validateAndProcessData(
                results.data,
              );
              if (errors.length > 0) {
                toast({
                  title: 'Warning',
                  description: `Some rows had validation errors: ${errors.join(', ')}`,
                  variant: 'destructive',
                });
              }
              setData(validData);
              toast({
                title: 'Success',
                description: `${file.name} uploaded successfully`,
                variant: 'default',
              });
            },
            error: (error: Error) => {
              console.error('CSV parsing error:', error);
              toast({
                title: 'Error',
                description: 'Failed to parse CSV file',
                variant: 'destructive',
              });
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            console.error('File processing error:', error);
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      };
      reader.readAsText(file);
    },
    [],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [sellerData, setSellerData] = useState<ProcessedRow[] | undefined>(
    undefined,
  );
  const [competitorData, setCompetitorData] = useState<ProcessedRow[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[] | undefined>(
    undefined,
  );

  const validateData = (): boolean => {
    if (!sellerData && !competitorData && !asin) {
      toast({
        title: 'Error',
        description: 'Please upload data files or enter an ASIN',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const processCsvData = (): void => {
    try {
      let processedSellerData = sellerData;
      let processedCompetitorData = competitorData;

      if (!processedSellerData && sellerData) {
        processedSellerData = sellerData;
      }

      if (!processedCompetitorData.length && competitorData.length) {
        processedCompetitorData = competitorData;
      }

      if (processedSellerData && processedCompetitorData) {
        const formattedData = processedCompetitorData.map((row) => {
          const competitor = sanitizeHtml(row.asin || row.niche || 'N/A');
          const dataPoint: ChartDataPoint = {
            name: competitor,
          };

          metrics.forEach((metric) => {
            const value = row[metric as keyof ProcessedRow];
            if (value !== undefined && !isNaN(Number(value))) {
              dataPoint[metric] = Number(value);
            }
          });

          return dataPoint;
        });

        if (formattedData.length > 0 && metrics.length > 0) {
          // Check storage size before saving
          const dataSize = new Blob([JSON.stringify(formattedData)]).size;
          if (dataSize <= MAX_STORAGE_SIZE) {
            sessionStorage.setItem('chartData', JSON.stringify(formattedData));
            setChartData(formattedData);
          } else {
            sessionStorage.removeItem('chartData');
            logger.warn(
              'Data exceeds storage limit, not saved to localStorage',
            );
          }
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      logger.error('Error processing CSV data:', { error });
      toast({
        title: 'Error',
        description: 'Failed to process data',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const fetchAndProcessApiData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/amazon/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asin: sanitizeHtml(asin),
          metrics,
          sellerData: sellerData,
          competitorData: competitorData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('API Error:', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`Failed to fetch competitor data: ${response.status}`);
      }

      interface ApiResponse {
        competitors: string[];
        metrics: Record<string, number[]>;
      }

      let data: ApiResponse;
      try {
        data = await response.json();
        if (!data || !data.competitors || !data.metrics) {
          logger.error('Invalid API response:', { data });
          throw new Error('Invalid response format from server');
        }

        // Validate and sanitize API response data
        data.competitors = data.competitors.map((comp) => sanitizeHtml(comp));
        Object.entries(data.metrics).forEach(([metric, values]) => {
          data.metrics[metric as string] = values.map((v) => {
            const num = Number(v);
            return isNaN(num) ? 0 : num;
          });
        });
      } catch (error) {
        logger.error('API parsing error:', { error });
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to parse server response',
        );
      }

      const formattedData = data.competitors.map((competitor, index) => {
        const dataPoint: ChartDataPoint = {
          name: competitor,
        };

        metrics.forEach((metric) => {
          const metricData = data.metrics[metric];
          if (Array.isArray(metricData) && metricData[index] !== undefined) {
            const value = data.metrics[metric][index];
            if (typeof value === 'number') {
              dataPoint[metric] = value;
            } else {
              dataPoint[metric] = 0;
            }
          } else {
            dataPoint[metric] = 0; // Default value if data is missing
          }
        });

        return dataPoint;
      });

      if (formattedData.length > 0 && metrics.length > 0) {
        setChartData(formattedData);
      } else {
        throw new Error('No data available to render');
      }

      setIsLoading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error processing file:', errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setChartData(undefined);
      setIsLoading(false);
    }
  };

  const analyzeCompetitor = async () => {
    if (!validateData()) {
      return;
    }

    setIsLoading(true);

    processCsvData();

    if (!chartData) {
      await fetchAndProcessApiData();
    }

    setIsLoading(false);
  };

  const isMobile = useIsMobile();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div
          className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="seller-csv">Seller Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
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
              accept=".csv"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFileUpload(
                  e,
                  setSellerData as React.Dispatch<
                    React.SetStateAction<ProcessedRow[] | null>
                  >,
                );
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="competitor-csv">Competitor Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
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
              accept=".csv"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFileUpload(
                  e,
                  setCompetitorData as React.Dispatch<
                    React.SetStateAction<ProcessedRow[] | null>
                  >,
                );
              }}
            />
          </div>
        </div>

        <div>
          <div className="space-y-2">
            <Label htmlFor="asin">Or Enter Competitor ASIN</Label>
            <Input
              id="asin"
              value={asin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAsin(e.target.value);
              }}
              placeholder="B0XXXXXXXX"
            />
            <p className="text-sm text-muted-foreground">
              ASIN format: 10 characters (letters/numbers)
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="metrics">Metrics to Compare</Label>
          <div className="flex flex-col gap-2">
            {(
              [
                'price',
                'reviews',
                'rating',
                'conversion_rate',
                'click_through_rate',
              ] as const
            ).map((metric) => (
              <div key={metric} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={metric}
                  checked={metrics.includes(metric as MetricType)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMetrics([...metrics, metric as MetricType]);
                    } else {
                      setMetrics(
                        metrics.filter((m) => m !== (metric as MetricType)),
                      );
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={metric}>
                  {metric
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={analyzeCompetitor} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Competitor'}
          </Button>
          <Button
            variant="outline"
            disabled={!chartData}
            onClick={() => {
              // Save analysis results to localStorage
              const timestamp = new Date().toISOString();
              const savedAnalyses = JSON.parse(
                sessionStorage.getEncryptedItem('competitorAnalyses') || '[]',
              );
              savedAnalyses.push({
                id: timestamp,
                date: new Date().toLocaleString(),
                asin,
                metrics,
                chartData,
              });
              // Replaced localStorage with encrypted session storage
              sessionStorage.setEncryptedItem(
                'competitorAnalyses',
                JSON.stringify(savedAnalyses),
              );
              toast({
                title: 'Success',
                description: 'Analysis saved for future reference',
                variant: 'default',
              });
            }}
          >
            Save Analysis
          </Button>
        </div>

        {chartData ? (
          <div className="mt-4 h-[400px] w-full">
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={isMobile ? 45 : 0}
                  textAnchor={isMobile ? 'start' : 'middle'}
                  tick={{ fontSize: isMobile ? 10 : 14 }}
                />
                <YAxis />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="w-full">
                      <Info className="mr-2 h-4 w-4" />
                      View Analysis
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-300 rounded-md shadow-sm">
                    {chartData && chartData.length > 0 ? (
                      chartData.map((entry: ChartDataPoint, index: number) => (
                        <div key={`tooltip-${index}`}>
                          {entry.name}: {entry.price}
                        </div>
                      ))
                    ) : (
                      <div>No data available</div>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {metrics.map((metric) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={getChartColor(metric)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
