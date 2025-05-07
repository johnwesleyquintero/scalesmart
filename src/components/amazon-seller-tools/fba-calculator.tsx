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

export const formatNumber = (value: number, decimals = 2): string => {
  try {
    if (isNaN(decimals) || decimals < 0 || decimals > 20) {
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
export const calculateRoi = (profit: number, cost: number): number => {
  if (cost === 0) {
    if (profit === 0) return 0;
    return profit > 0 ? Infinity : -Infinity;
  }
  return (profit / cost) * 100;
};

export const calculateMargin = (profit: number, price: number): number => {
  if (price === 0) {
    if (profit === 0) return 0;
    return profit > 0 ? Infinity : -Infinity;
  }
  return (profit / price) * 100;
};

export const calculateFbaMetrics = async (
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

interface FbaCalculatorProps {
  onCalculateAction: (data: FbaCalculationResult[]) => void;
}

export default function FbaCalculator({
  onCalculateAction,
}: FbaCalculatorProps) {
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
            });
            onCalculateAction(validResults);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'An unknown error occurred during processing.';
            setError(message);
            setResults([]);
            toast({
              title: 'Processing Failed',
              description: message
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
          toast({title: 'Upload Failed', description: `Error reading CSV file: ${err.message}`});

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
      toast({title: 'Export Error', description: msg});
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
      toast({title: 'Export Successful', description: 'FBA calculation results exported to CSV.'});
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during export.';
      setError(`Failed to export data: ${message}`);
      toast({title: 'Export Failed', description: message});
    }
  }, [results, toast]);

  const clearData = useCallback(() => {
    setResults([]);
    setError(null);
    setManualInput({ product: '', cost: 0, price: 0, fees: 0 }); // Reset manual form
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    toast({title: 'Data Cleared', description: 'All calculation results have been removed.'});
  }, [toast]);

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div
        role="alert"
        className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3"
      >
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
                  data-testid="file-upload-input"
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
            :start_line:478 -------
            <ManualFbaForm
              initialValues={manualInput}
              onSubmit={async (values, errors) => {
                if (errors && errors.length > 0) {
                  return;
                }
                try {
                  const metrics = await calculateFbaMetrics(values);
                  setResults([{ ...values, ...metrics }]);
                  toast({
                    title: 'Calculation Complete',
                    description: `Calculated metrics for ${values.product}`
                  });
                  onCalculateAction([{ ...values, ...metrics }]);
                } catch (error) {
                  toast({
                    title: 'Calculation Failed',
                    description: error instanceof Error
                      ? error.message
                      : 'Failed to calculate metrics'
                  });
                }
              }}
              onReset={() => {
                setManualInput({ product: '', cost: 0, price: 0, fees: 0 });
              }}
            />
          </CardContent>
        </DataCard>
      </div>

      {/* Results Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoading && (
        <DataCard>
          <CardContent className="p-0">
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li className="p-4">Loading...</li>
            </ol>
          </CardContent>
        </DataCard>
      )}

      {results.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3">Product</TableHead>
                    <TableHead className="px-4 py-3">Cost ($)</TableHead>
                    <TableHead className="px-4 py-3">Price ($)</TableHead>
                    <TableHead className="px-4 py-3">Fees ($)</TableHead>
                    <TableHead className="px-4 py-3">Profit ($)</TableHead>
                    <TableHead className="px-4 py-3">ROI (%)</TableHead>
                    <TableHead className="px-4 py-3">Margin (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => {
                    return (
                      <TableRow
                        key={`${item.product}-${index}`}
                        className="hover:bg-muted"
                      >
                        <TableCell className="px-4 py-3">
                          {item.product}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {formatNumber(item.cost)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {formatNumber(item.price)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {formatNumber(item.fees)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {formatNumber(item.profit)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="w-full min-w-[100px]">
                            <Progress
                              value={item.roi}
                              max={100}
                              className="h-4"
                            />
                            {formatNumber(item.roi)}%
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="w-full min-w-[100px]">
                            <Progress
                              value={item.margin}
                              max={100}
                              className="h-4"
                            />
                            {formatNumber(item.margin)}%
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

      {/* Export and Clear Buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline" onClick={handleExport} disabled={isLoading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="destructive" onClick={clearData} disabled={isLoading}>
          <XCircle className="h-4 w-4 mr-2" />
          Clear Data
        </Button>
      </div>
    </div>
  );
}
