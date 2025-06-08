'use client';

import { useToast } from '@/hooks/use-toast.ts';
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Upload,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import ManualFbaForm from './ManualFbaForm';

// Local/UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Utility Imports
import { exportToCSV } from '@/lib/amazon-tools/export-utils';
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import {
  fbaHeaders,
  validateFbaRow,
  FbaCsvRow,
} from '@/lib/hooks/use-fba-validator';
import { monetaryValueSchema } from '@/lib/input-validation';

/**
 * Calculates ROI (Return on Investment).
 * @param profit The calculated profit.
 * @param cost The cost of the product.
 * @returns The ROI as a percentage. Handles division by zero.
 */
const calculateRoi = (profit: number, cost: number): number => {
  if (cost === 0) {
    return profit === 0 ? 0 : profit > 0 ? Infinity : -Infinity;
  }
  return (profit / cost) * 100;
};

/**
 * Calculates Profit Margin.
 * @param profit The calculated profit.
 * @param price The selling price of the product.
 * @returns The profit margin as a percentage. Handles division by zero.
 */
const calculateMargin = (profit: number, price: number): number => {
  if (price === 0) {
    return profit === 0 ? 0 : profit > 0 ? Infinity : -Infinity;
  }
  return (profit / price) * 100;
};

/**
 * Calculates FBA metrics (profit, ROI, margin) for a given input.
 * Includes validation for monetary values.
 * @param input The FBA calculation input (product, cost, price, fees).
 * @returns A promise resolving to an object containing profit, ROI, and margin.
 * @throws Error if input values are invalid.
 */
const calculateFbaMetrics = async (
  input: FbaCalculationInput,
): Promise<Pick<FbaCalculationResult, 'profit' | 'roi' | 'margin'>> => {
  try {
    const validatedCost = monetaryValueSchema.parse(input.cost);
    const validatedPrice = monetaryValueSchema.parse(input.price);
    const validatedFees = monetaryValueSchema.parse(input.fees);

    const profit = validatedPrice - validatedCost - validatedFees;
    const roi = calculateRoi(profit, validatedCost);
    const margin = calculateMargin(profit, validatedPrice);

    return { profit, roi, margin };
  } catch (error: unknown) {
    console.error('Failed to calculate FBA metrics', {
      component: 'FbaCalculator',
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw new Error(
      `Failed to calculate FBA metrics: ${error instanceof Error ? error.message : 'Invalid input values'}`,
    );
  }
};

/**
 * `FbaCalculator` component provides tools for calculating FBA (Fulfillment by Amazon)
 * profitability metrics. Users can upload a CSV file with product data or manually
 * enter details for a single product.
 *
 * Features:
 * - CSV upload and parsing for bulk calculations.
 * - Manual input form for single product calculations.
 * - Calculates Profit, Return on Investment (ROI), and Profit Margin.
 * - Displays results in a table.
 * - Provides export functionality for calculated results.
 * - Includes robust error handling and user feedback via toasts.
 */
export default function FbaCalculator() {
  const { toast } = useToast();
  const [results, setResults] = useState<FbaCalculationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<FbaCalculationInput>({
    product: '',
    cost: 0,
    price: 0,
    fees: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * CSV parser instance using the custom hook.
   * It handles parsing, initial row validation, and provides callbacks for success/error.
   */
  const csvParser = useCsvParser<FbaCsvRow>(
    {
      requiredHeaders: fbaHeaders.required,
      validateRow: (row) => validateFbaRow(row as Record<string, string>, 0), // Explicitly cast to string record
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
      data: FbaCsvRow[];
      skippedRows: Array<{ index: number; reason: string }>;
    }) => {
      let skippedRowCount = 0;
      const processedResults = await Promise.all(
        result.data.map(async (row, index) => {
          const productName = row.product?.trim();
          const cost = Number(row.cost);
          const price = Number(row.price);
          const fees = Number(row.fees);

          // Additional numeric validation after initial CSV parsing
          if (
            !productName ||
            isNaN(cost) ||
            cost < 0 ||
            isNaN(price) ||
            price < 0 ||
            isNaN(fees) ||
            fees < 0
          ) {
            skippedRowCount++;
            console.warn(
              `Skipping row ${index + 2} due to invalid numeric values or missing product name.`,
            );
            return null;
          }

          const inputData: FbaCalculationInput = {
            product: productName,
            cost,
            price,
            fees,
          };

          try {
            const metrics = await calculateFbaMetrics(inputData);
            return { ...inputData, ...metrics };
          } catch (calcError) {
            skippedRowCount++;
            console.warn(
              `Skipping row ${index + 2} for "${productName}" due to calculation error: ${calcError instanceof Error ? calcError.message : 'Unknown error'}`,
            );
            return null;
          }
        }),
      );

      const validResults = processedResults.filter(
        (item): item is FbaCalculationResult => item !== null,
      );

      if (validResults.length === 0) {
        const msg =
          result.data.length > 0
            ? `No valid data found in the CSV after processing ${result.data.length} rows. Ensure 'product', 'cost', 'price', 'fees' columns are present and contain valid non-negative numbers.`
            : 'The uploaded CSV file appears to be empty or contains no data rows.';
        setError(msg);
        toast({
          title: 'Processing Failed',
          description: msg,
          variant: 'destructive',
        });
      } else {
        setResults(validResults);
        const processedMessage = `Processed ${validResults.length} products`;
        const skippedMessage =
          skippedRowCount > 0 ? ` Skipped ${skippedRowCount} invalid rows` : '';
        setError(
          skippedRowCount > 0 ? `${processedMessage}.${skippedMessage}` : null,
        );
        toast({
          title: 'CSV Processed',
          description: `${processedMessage}.${skippedMessage}`,
          variant: 'success',
        });
      }
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    },
  );

  /**
   * Handles the file upload event, initiating CSV parsing.
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setError('No file selected.');
        return;
      }
      setIsLoading(true);
      setError(null);
      csvParser.parseFile(file).catch((err) => {
        // Error is already handled by csvParser's error callback, but catch here for completeness
        console.error('File parsing initiation failed:', err);
      });
    },
    [csvParser],
  );

  /**
   * Handles exporting the current calculation results to a CSV file.
   */
  const handleExport = useCallback(() => {
    if (results.length === 0) {
      const msg = 'No data to export.';
      setError(msg);
      toast({ title: 'Export Error', description: msg, variant: 'warning' });
      return;
    }
    setError(null);

    const exportData = results.map((item) => ({
      Product: item.product,
      Cost: item.cost.toFixed(2),
      Price: item.price.toFixed(2),
      Fees: item.fees.toFixed(2),
      Profit: item.profit.toFixed(2),
      ROI_Percent: isFinite(item.roi) ? item.roi.toFixed(2) : 'Infinity',
      Margin_Percent: isFinite(item.margin)
        ? item.margin.toFixed(2)
        : 'Infinity',
    }));

    try {
      exportToCSV(exportData, 'fba_calculator_results.csv');
      toast({
        title: 'Export Successful',
        description: 'FBA calculation results exported to CSV.',
        variant: 'success',
      });
    } catch (err: unknown) {
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
  }, [results, toast]);

  /**
   * Clears all calculation results and resets the form.
   */
  const clearData = useCallback(() => {
    setResults([]);
    setError(null);
    setManualInput({ product: '', cost: 0, price: 0, fees: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All calculation results have been removed.',
      variant: 'info',
    });
  }, [toast]);

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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Upload FBA Data CSV
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Bulk calculate profit metrics from a CSV file
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Manual Calculation
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Enter details for a single product
            </p>
          </CardHeader>
          <CardContent>
            <ManualFbaForm
              initialValues={manualInput}
              onSubmit={async (values) => {
                try {
                  const metrics = await calculateFbaMetrics(values);
                  setResults([{ ...values, ...metrics }]);
                  toast({
                    title: 'Calculation Complete',
                    description: `Calculated metrics for ${values.product}`,
                    variant: 'success',
                  });
                } catch (error: unknown) {
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
        </Card>
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
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />
          {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">Processing data...</p>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Calculation Results ({results.length} Products)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Detailed FBA profitability analysis
            </p>
          </CardHeader>
          <CardContent className="p-0">
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
                    const isProfitable = item.profit >= 0;
                    const profitColorClass = isProfitable
                      ? 'text-green-500'
                      : 'text-red-500';
                    const roiDisplay = isFinite(item.roi)
                      ? `${item.roi.toFixed(2)}%`
                      : '∞';
                    const marginDisplay = isFinite(item.margin)
                      ? `${item.margin.toFixed(2)}%`
                      : '∞';

                    const px4py3 = 'px-4 py-3';

                    return (
                      <TableRow
                        key={`${item.product}-${index}`}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className={`${px4py3} font-medium`}>
                          {item.product}
                        </TableCell>
                        <TableCell className={`${px4py3} text-right`}>
                          {item.cost.toFixed(2)}
                        </TableCell>
                        <TableCell className={`${px4py3} text-right`}>
                          {item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className={`${px4py3} text-right`}>
                          {item.fees.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`${px4py3} text-right ${profitColorClass}`}
                        >
                          {item.profit.toFixed(2)}
                        </TableCell>
                        <TableCell className={`${px4py3} text-right`}>
                          {roiDisplay}
                        </TableCell>
                        <TableCell className={`${px4py3} text-right`}>
                          {marginDisplay}
                        </TableCell>
                        <TableCell className={`${px4py3} text-center`}>
                          {item.margin > 20
                            ? 'High'
                            : item.margin > 10
                              ? 'Medium'
                              : 'Low'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
