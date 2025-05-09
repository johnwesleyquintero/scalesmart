'use client';

import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Upload,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
import ManualFbaForm from './ManualFbaForm';

// Local/UI Imports
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DataCard from './DataCard';
import SampleCsvButton from './sample-csv-button';

// Types
export interface FbaCalculationInput {
  product: string;
  cost: number;
  price: number;
  fees: number;
}

interface FbaCalculationResult extends FbaCalculationInput {
  profit: number;
  roi: number; // Return on Investment (%)
  margin: number; // Profit Margin (%)
}

type CsvInputRow = {
  product?: string | null;
  cost?: number | string | null;
  price?: number | string | null;
  fees?: number | string | null;
};

// Import validation schemas and logger
import { logger } from '@/lib/logger';

/**
 * Formats a number for display, handling edge cases
 * @param value The number to format
 * @param decimals Number of decimal places (default 2)
 * @returns Formatted string representation
 */
const formatNumber = (value: number, decimals: number = 2): string => {
  try {
    if (!isFinite(value)) {
      logger.warn('Non-finite value encountered in formatNumber', { value });
      if (value > 0) return '∞';
      if (value < 0) return '-∞';
      return '0';
    }

    if (decimals < 0) {
      logger.warn('Invalid decimals value in formatNumber', { decimals });
      decimals = 2; // Reset to default
    }

    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
    if (absValue >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
    if (absValue >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
    return value.toFixed(decimals);
  } catch (error) {
    logger.error('Error in formatNumber', {
      value,
      decimals,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return '0';
  }
};

/**
 * Calculates FBA metrics with improved error handling and validation
 */
const calculateRoi = (profit: number, cost: number): number => {
  if (cost === 0) {
    if (profit === 0) return 0;
    return profit > 0 ? Infinity : -Infinity;
  }
  return (profit / cost) * 100;
};

const calculateMargin = (profit: number, price: number): number => {
  if (price === 0) {
    if (profit === 0) return 0;
    return profit > 0 ? Infinity : -Infinity;
  }
  return (profit / price) * 100;
};

const calculateFbaMetrics = async (
  input: FbaCalculationInput,
): Promise<Pick<FbaCalculationResult, 'profit' | 'roi' | 'margin'>> => {
  try {
    const { monetaryValueSchema } = await import('@/lib/input-validation');
    const validatedCost = monetaryValueSchema.parse(input.cost);
    const validatedPrice = monetaryValueSchema.parse(input.price);
    const validatedFees = monetaryValueSchema.parse(input.fees);

    const profit = validatedPrice - validatedCost - validatedFees;
    const roi = calculateRoi(profit, validatedCost);
    const margin = calculateMargin(profit, validatedPrice);

    return { profit, roi, margin };
  } catch (error) {
    // Log the error with detailed information
    logger.error('Failed to calculate FBA metrics', {
      component: 'FbaCalculator',
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    // Rethrow with more descriptive message
    throw new Error(
      `Failed to calculate FBA metrics: ${error instanceof Error ? error.message : 'Invalid input values'}`,
    );
  }
};

// --- Component ---
export default function FbaCalculator() {
  const { toast } = useToast();
  const [results, setResults] = useState<FbaCalculationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Simplified state for manual input form
  const [manualInput, setManualInput] = useState<FbaCalculationInput>({
    product: '',
    cost: 0,
    price: 0,
    fees: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setResults([]); // Clear previous results

      Papa.parse<CsvInputRow>(file, {
        header: true,
        dynamicTyping: false, // Parse everything as string initially for better validation control
        skipEmptyLines: true,
        complete: async (result) => {
          try {
            if (result.errors.length > 0) {
              throw new Error(
                `CSV parsing error: ${result.errors[0].message}. Check row ${result.errors[0].row}.`,
              );
            }

            // Validate required headers (case-insensitive)
            const requiredHeaders = ['product', 'cost', 'price', 'fees'];
            const actualHeaders =
              result.meta.fields?.map((h) => h.toLowerCase()) || [];
            const missingHeaders = requiredHeaders.filter(
              (header) => !actualHeaders.includes(header),
            );

            if (missingHeaders.length > 0) {
              throw new Error(
                `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${result.meta.fields?.join(', ') || 'None'}`,
              );
            }

            let skippedRowCount = 0;
            // Process the parsed data
            const processedResults = await Promise.all(
              result.data.map(async (row, index) => {
                const productName = row.product?.trim();
                const costStr =
                  typeof row.cost === 'string' ? row.cost.trim() : row.cost;
                const priceStr =
                  typeof row.price === 'string' ? row.price.trim() : row.price;
                const feesStr =
                  typeof row.fees === 'string' ? row.fees.trim() : row.fees;

                // Validate product name
                if (!productName) {
                  console.warn(
                    `Skipping row ${index + 2}: Missing product name.`,
                  );
                  skippedRowCount++;
                  return null;
                }

                // Validate and convert numeric values
                const cost = Number(costStr);
                const price = Number(priceStr);
                const fees = Number(feesStr);

                if (isNaN(cost) || cost < 0) {
                  console.warn(
                    `Skipping row ${index + 2} for "${productName}": Invalid or negative cost value ('${costStr}').`,
                  );
                  skippedRowCount++;
                  return null;
                }
                if (isNaN(price) || price < 0) {
                  console.warn(
                    `Skipping row ${index + 2} for "${productName}": Invalid or negative price value ('${priceStr}').`,
                  );
                  skippedRowCount++;
                  return null;
                }
                if (isNaN(fees) || fees < 0) {
                  console.warn(
                    `Skipping row ${index + 2} for "${productName}": Invalid or negative fees value ('${feesStr}').`,
                  );
                  skippedRowCount++;
                  return null;
                }

                const inputData: FbaCalculationInput = {
                  product: productName,
                  cost,
                  price,
                  fees,
                };
                const metrics = await calculateFbaMetrics(inputData);

                return { ...inputData, ...metrics };
              }),
            );

            // Filter out null results and ensure type safety
            const validResults = processedResults.filter(
              (item): item is FbaCalculationResult => {
                return (
                  item !== null &&
                  typeof item === 'object' &&
                  'profit' in item &&
                  'roi' in item &&
                  'margin' in item
                );
              },
            );

            if (validResults.length === 0) {
              if (result.data.length > 0) {
                throw new Error(
                  `No valid data found in the CSV after processing ${result.data.length} rows. Ensure 'product', 'cost', 'price', 'fees' columns are present and contain valid non-negative numbers.`,
                );
              } else {
                throw new Error(
                  'The uploaded CSV file appears to be empty or contains no data rows.',
                );
              }
            }

            setResults(validResults);
            const processedMessage = `Processed ${validResults.length} products`;
            const skippedMessage =
              skippedRowCount > 0
                ? ` Skipped ${skippedRowCount} invalid rows`
                : '';
            setError(
              skippedRowCount > 0
                ? `${processedMessage}.${skippedMessage}`
                : null,
            );
            toast({
              title: 'CSV Processed',
              description: `${processedMessage}.${skippedMessage}`,
              variant: 'default',
            });
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'An unknown error occurred during processing.';
            setError(message);
            setResults([]);
            toast({
              title: 'Processing Failed',
              description: message,
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);

            if (event.target) {
              event.target.value = '';
            }
          }
        },
        error: (err: Error) => {
          setError(`Error reading CSV file: ${err.message}`);
          setIsLoading(false);
          setResults([]);
          toast({
            title: 'Upload Failed',
            description: `Error reading CSV file: ${err.message}`,
            variant: 'destructive',
          });

          if (event.target) {
            event.target.value = '';
          }
        },
      });
    },
    [toast], // Added toast dependency
  );

  const handleExport = useCallback(() => {
    if (results.length === 0) {
      const msg = 'No data to export.';
      setError(msg);
      toast({
        title: 'Export Error',
        description: msg,
        variant: 'destructive',
      });
      return;
    }
    setError(null);

    // Prepare data for CSV export, formatting numbers
    const exportData = results.map((item) => ({
      Product: item.product,
      Cost: item.cost.toFixed(2),
      Price: item.price.toFixed(2),
      Fees: item.fees.toFixed(2),
      Profit: item.profit.toFixed(2),
      ROI_Percent: isFinite(item.roi) ? item.roi.toFixed(2) : 'Infinity', // Handle Infinity
      Margin_Percent: isFinite(item.margin)
        ? item.margin.toFixed(2)
        : 'Infinity', // Handle Infinity
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fba_calculator_results.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up blob URL
      toast({
        title: 'Export Successful',
        description: 'FBA calculation results exported to CSV.',
        variant: 'default',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during export.';
      setError(`Failed to export data: ${message}`);
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [results, toast]); // Added dependencies

  const clearData = useCallback(() => {
    setResults([]);
    setError(null);
    setManualInput({ product: '', cost: 0, price: 0, fees: 0 }); // Reset manual form
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    toast({
      title: 'Data Cleared',
      description: 'All calculation results have been removed.',
      variant: 'default',
    });
  }, [toast]); // Added dependency

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How it Works:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Upload a CSV file with columns: product, cost, price, fees</li>
            <li>Or, manually enter details for a single product.</li>
            <li>
              The tool calculates Profit, Return on Investment (ROI), and Profit
              Margin.
            </li>
            <li>Export the results to a new CSV file.</li>
            <li>
              Ensure all monetary values (`cost`, `price`, `fees`) are
              non-negative numbers.
            </li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CSV Upload Card */}
        <DataCard>
          {/* CardContent is implicitly handled by DataCard, adjust padding via className if needed */}
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload FBA Data CSV</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bulk calculate profit metrics from a CSV file
              </p>
            </div>
            <div className="w-full">
              <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  Click or drag CSV file here
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Requires: product, cost, price, fees)
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
              <div className="flex justify-center mt-4">
                <SampleCsvButton
                  dataType="fba" // Ensure this type exists in your sample data generator
                  fileName="sample-fba-calculator.csv"
                />
              </div>
            </div>
          </div>
        </DataCard>

        {/* Manual Entry Card */}
        <DataCard>
          <CardContent className="p-6">
            {' '}
            {/* Explicit CardContent for padding control */}
            <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
              Manual Calculation
            </h3>
            <ManualFbaForm
              initialValues={manualInput}
              onSubmit={async (values) => {
                try {
                  const metrics = await calculateFbaMetrics(values);
                  setResults([{ ...values, ...metrics }]);
                  toast({
                    title: 'Calculation Complete',
                    description: `Calculated metrics for ${values.product}`,
                    variant: 'default',
                  });
                } catch (error) {
                  toast({
                    title: 'Calculation Failed',
                    description:
                      error instanceof Error
                        ? error.message
                        : 'Failed to calculate metrics',
                    variant: 'destructive',
                  });
                }
              }}
              onReset={() => {
                setManualInput({ product: '', cost: 0, price: 0, fees: 0 });
              }}
            />
          </CardContent>
          <div className="bg-muted/20 p-4 rounded-b-lg">
            <h4 className="font-semibold mb-2 text-sm">
              How to use this calculator:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Enter product details in the form</li>
              <li>View calculated profit, ROI, and profit margin</li>
            </ol>
          </div>
        </DataCard>
      </div>

      {/* Action Buttons (Export/Clear) */}
      {results.length > 0 && !isLoading && (
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
            onClick={() => setError(null)}
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
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />{' '}
          {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">Processing data...</p>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-0">
            {' '}
            {/* Remove default padding for table */}
            <h3 className="text-lg font-semibold p-4 border-b">
              Calculation Results ({results.length} Products)
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left font-medium whitespace-nowrap">
                      Product
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Cost ($)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Price ($)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Fees ($)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Profit ($)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      ROI (%)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Margin (%)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center font-medium whitespace-nowrap">
                      Profitability (Margin)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => {
                    const profitColor =
                      item.profit < 0 ? 'text-red-500' : 'text-green-500';
                    const roiDisplay = isFinite(item.roi)
                      ? `${item.roi.toFixed(2)}%`
                      : '∞';
                    const marginDisplay = isFinite(item.margin)
                      ? `${item.margin.toFixed(2)}%`
                      : '∞';

                    return (
                      <TableRow
                        key={`${item.product}-${index}`}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-4 py-3 font-medium">
                          {item.product}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {item.cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {item.fees.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`px-4 py-3 text-right font-semibold ${profitColor}`}
                        >
                          {item.profit.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`px-4 py-3 text-right ${item.roi < 0 ? 'text-red-500' : 'text-green-500'}`}
                        >
                          {roiDisplay}
                        </TableCell>
                        <TableCell
                          className={`px-4 py-3 text-right ${item.margin < 0 ? 'text-red-500' : 'text-green-500'}`}
                        >
                          {marginDisplay}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="w-full min-w-[100px]">
                            {' '}
                            {/* Ensure progress bar has some width */}
                            <Progress
                              value={Math.max(
                                0,
                                Math.min(
                                  isFinite(item.margin) ? item.margin : 0,
                                  100,
                                ),
                              )}
                              className="h-2"
                              // Optional: Add color based on value
                              // indicatorClassName={progressValue < 10 ? 'bg-red-500' : progressValue < 25 ? 'bg-yellow-500' : 'bg-green-500'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </DataCard>
      )}
    </div>
  );
}
const getMarginColorClass = (margin: number): string => {
  if (margin > 0) return 'text-green-600 dark:text-green-400';
  if (margin < 0) return 'text-red-600 dark:text-red-400';
  return 'text-yellow-600 dark:text-yellow-400';
};
