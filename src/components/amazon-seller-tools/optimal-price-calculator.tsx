'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AmazonAlgorithms } from '@/lib/amazon-tools/amazon-algorithms';
import {
  validateOptimalPriceInputs,
  type OptimalPriceInputs,
} from '@/lib/amazon-tools/optimal-price-schema';
import { ProductCategory } from '@/lib/amazon-types';
import { logger } from '@/lib/logger';
import type React from 'react'; // Import React explicitly
import { useState } from 'react';
import { ZodError } from 'zod'; // Import Zod for error handling type

// Define the state structure, aligning with form inputs
// competitorPrices will be stored as a string in state, parsed later
interface OptimalPriceFormState
  extends Omit<OptimalPriceInputs, 'competitorPrices'> {
  competitorPrices: string; // Store as comma-separated string
}

// Initial state matching the form structure
const initialFormState: OptimalPriceFormState = {
  cost: 0,
  currentPrice: 0,
  competitorPrices: '', // Initialize as empty string
  reviewRating: 4.5,
  reviewCount: 42,
  priceCompetitiveness: 0.92,
  inventoryHealth: 0.8,
  weight: 1.2,
  volume: 0.05,
  // Add missing fields required by OptimalPriceInputs schema with defaults
  price: 0, // Default value, might be same as currentPrice initially
  category: ProductCategory.STANDARD, // Default category
  salesRank: 1000, // Default sales rank
  reviews: 42, // Default reviews, might be same as reviewCount
};

// Helper function to calculate margin, avoiding nested ternary
const calculateMargin = (profit: number, optimalPrice: number): number => {
  if (optimalPrice > 0) {
    return (profit / optimalPrice) * 100;
  }
  // Handle optimalPrice being 0 or less
  if (profit > 0) {
    return Infinity; // Or handle as appropriate (e.g., return a large number or specific string)
  }
  return 0; // If profit is also 0 or negative
};

export default function OptimalPriceCalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<OptimalPriceFormState>(initialFormState);

  // Removed unused competitorPricesArray and related TS error
  // const competitorPricesArray = validatedInputs?.competitorPrices?.map(Number) || [];

  const [results, setResults] = useState<
    | {
        optimalPrice: number;
        profit: number;
        margin: number;
      }
    | undefined
  >(undefined);

  const [error, setError] = useState<string | undefined>(undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInputs((prev) => ({
      ...prev,
      // Keep competitorPrices as string, parse others to number if applicable
      [name]:
        type === 'number' && name !== 'competitorPrices'
          ? parseFloat(value) || 0 // Default to 0 if parsing fails
          : value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      category: value as ProductCategory,
    }));
  };

  const calculateOptimalPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setResults(undefined); // Clear previous results

    try {
      // 1. Prepare data for validation (parse competitorPrices string)
      const competitorPricesArray = inputs.competitorPrices
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n) && n > 0); // Filter out invalid numbers

      const dataToValidate: OptimalPriceInputs = {
        ...inputs,
        // Use currentPrice for the 'price' field required by the schema if not separately managed
        price: inputs.currentPrice,
        reviews: inputs.reviewCount, // Use reviewCount for 'reviews' if not separately managed
        competitorPrices: competitorPricesArray,
      };

      // 2. Validate all inputs using Zod schema
      const validationResult = validateOptimalPriceInputs(dataToValidate);

      // Key updates in validation handling
      if (!validationResult.success) {
        // FIX 1 & 2: Check if error exists and handle ZodError vs string error
        function isZodError(error: any): error is ZodError {
          return error instanceof ZodError;
        }

        if (validationResult.error) {
          if (isZodError(validationResult.error)) {
            const errorMessages = validationResult.error.issues
              .map((issue: any) => `Validation error: ${issue.message}`) // Removed unnecessary object wrapping
              .join('\n');
            setError(errorMessages);
          } else if (typeof validationResult.error === 'string') {
            // Handle case where error is a string message
            setError(validationResult.error);
          } else {
            // Fallback for unexpected error types
            setError(
              'Validation failed: An unexpected error occurred. Please check your inputs and try again.',
            );
          }
        } else {
          setError(
            'Validation failed: No specific error was identified. Please review your inputs for any missing or incorrect information.',
          );
        }
        return;
      }

      // Strict null checks for validated inputs
      // FIX: Renamed to avoid conflict with variable name later
      // validationResult.data is guaranteed to exist if success is true
      if (!validationResult.data)
        throw new Error('Validation failed - no data returned');
      const validatedData = validationResult.data;

      // Calculate product score with validated inputs
      const productScore = AmazonAlgorithms.calculateProductScore({
        // Ensure reviews is number | null
        reviews: validatedData?.reviews ?? undefined,
        rating: validatedData?.reviewRating,
        salesRank: validatedData?.salesRank,
        price: validatedData?.price,
        category: validatedData?.category,
      });

      // Calculate optimal price
      // FIX: Moved optimalPrice calculation before profit calculation
      const optimalPrice = AmazonAlgorithms.calculateOptimalPrice({
        currentPrice: validatedData.currentPrice,
        competitorPrices: validatedData.competitorPrices,
        productScore: productScore / 100, // Assuming score is 0-100
      });

      // Calculate profit and margin
      // FIX: Removed duplicate 'const' and moved calculation here
      const profit = optimalPrice - (validatedData?.cost ?? 0);
      // FIX: Use helper function to avoid nested ternary
      const margin = calculateMargin(profit, optimalPrice);

      // Log successful calculation
      logger.info('Optimal price calculated successfully', {
        component: 'OptimalPriceCalculator',
        inputs: validatedData,
        results: { optimalPrice, profit, margin },
      });

      setResults({
        optimalPrice,
        profit,
        margin,
      });

      toast({
        title: 'Calculation Complete',
        description: `Optimal price calculated: $${optimalPrice.toFixed(2)}`,
      });
    } catch (error: unknown) {
      let errorMessages: string;
      if (error instanceof ZodError) {
        errorMessages = error.issues.map((issue) => issue.message).join(', ');
      } else if (error instanceof Error) {
        errorMessages = error.message;
      } else {
        errorMessages = 'Unknown validation error';
      }
      setError(errorMessages);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Optimal Price Calculator</h2>
        <form onSubmit={calculateOptimalPrice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cost Input */}
            <div className="space-y-2">
              <Label htmlFor="cost">Product Cost ($)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={inputs.cost}
                onChange={handleInputChange}
                required
                placeholder="e.g., 5.50"
              />
            </div>

            {/* Current Price Input */}
            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current Selling Price ($)</Label>
              <Input
                id="currentPrice"
                name="currentPrice"
                type="number"
                step="0.01"
                min="0"
                value={inputs.currentPrice}
                onChange={handleInputChange}
                required
                placeholder="e.g., 19.99"
              />
            </div>

            {/* Competitor Prices Input */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="competitorPrices">
                Competitor Prices (comma-separated)
              </Label>
              <Input
                id="competitorPrices"
                name="competitorPrices"
                // Value is now the string from state
                value={inputs.competitorPrices}
                onChange={handleInputChange}
                placeholder="e.g., 19.99, 24.95, 22.50"
                required
              />
            </div>

            {/* Review Rating Input */}
            <div className="space-y-2">
              <Label htmlFor="reviewRating">Average Review Rating</Label>
              <Input
                id="reviewRating"
                name="reviewRating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={inputs.reviewRating}
                onChange={handleInputChange}
                required
                placeholder="e.g., 4.7"
              />
            </div>

            {/* Review Count Input */}
            <div className="space-y-2">
              <Label htmlFor="reviewCount">Number of Reviews</Label>
              <Input
                id="reviewCount"
                name="reviewCount"
                type="number"
                step="1"
                min="0"
                value={inputs.reviewCount}
                onChange={handleInputChange}
                required
                placeholder="e.g., 150"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category">Product Category</Label>
              <Select
                value={inputs.category}
                onValueChange={handleCategoryChange}
                // name="category" // Select doesn't use name attribute directly
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProductCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {/* Simple Capitalization */}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sales Rank Input (Added based on schema) */}
            <div className="space-y-2">
              <Label htmlFor="salesRank">Sales Rank (BSR)</Label>
              <Input
                id="salesRank"
                name="salesRank"
                type="number"
                step="1"
                min="1"
                value={inputs.salesRank}
                onChange={handleInputChange}
                required
                placeholder="e.g., 5000"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Calculate Optimal Price
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xl font-semibold">Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded">
                <div className="text-sm text-green-700 dark:text-green-300">
                  Optimal Price
                </div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  ${results.optimalPrice.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Estimated Profit
                </div>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  ${results.profit.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded">
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Profit Margin
                </div>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {isFinite(results.margin)
                    ? `${results.margin.toFixed(2)}%`
                    : 'N/A'}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: This is an estimated optimal price based on the provided
              inputs and algorithm. Market conditions can change rapidly.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Removed misplaced chartData lines
// chartData.push({
//   price: validatedInputs?.currentPrice ?? 0,
//   profitability: validatedInputs?.priceCompetitiveness ?? 0
// });
// FIX 3 & 4: Removed these lines as they are out of scope and redundant
// const competitorPrices = validationResult.data.competitorPrices;
// const currentPrice = validationResult.data.currentPrice;
