'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AmazonAlgorithms } from '@/lib/amazon-tools/amazon-algorithms';
import { ProductCategory } from '@/lib/amazon-types';
import type React from 'react';
import { useState } from 'react';
import CsvUploader from './CsvUploader';

interface ManualProduct {
  product: string;
  cost: number;
  price: number;
  fees: number;
}

export default function ProfitMarginCalculator() {
  // Define interfaces outside the component for better reusability
  interface ProductData {
    product: string;
    cost: number;
    fees: number;
    sessions?: number;
    reviewRating?: number;
    reviewCount?: number;
    priceCompetitiveness?: number;
    inventoryHealth?: number;
    weight?: number;
    volume?: number;
    competitorPrices?: number[];
    reviews?: number | null;
    salesRank?: number;
    price?: number;
    profit?: number;
    margin?: number;
    roi?: number;
  }

  interface CsvRow {
    id: string;
    impressions: number;
    clicks: number;
    [key: string]: string | number; // Allow additional fields from CSV
  }

  interface CalculatedResult extends ProductData {
    profit: number;
    margin: number;
    roi: number;
  }

  // Removed duplicate function export
  // Existing implementation kept at line 37

  const [results, setResults] = useState<CalculatedResult[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [csvData, setCsvData] = useState<ProductData[]>([]);
  const [manualProduct, setManualProduct] = useState<ManualProduct>({
    product: '',
    cost: 0,
    price: 0,
    fees: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateCsvRow = (row: CsvRow): ProductData | null => {
    try {
      if (!row.id?.trim()) {
        throw new Error('Missing product ID');
      }

      const impressions = Number(row.impressions);
      const clicks = Number(row.clicks);

      if (isNaN(impressions) || impressions < 0) {
        throw new Error(`Invalid impressions value for product ${row.id}`);
      }

      if (isNaN(clicks) || clicks < 0) {
        throw new Error(`Invalid clicks value for product ${row.id}`);
      }

      return {
        product: row.id.trim(),
        cost: 0,
        price: 0,
        fees: 0,
        sessions: clicks,
      };
    } catch (error) {
      console.error('Row validation error:', error);
      return null;
    }
  };

  const handleFileUpload = (data: CsvRow[]): void => {
    setError(undefined);
    setIsLoading(true);
    try {
      if (!data || data.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      const validatedData: ProductData[] = [];
      const errors: string[] = [];

      data.forEach((row, index) => {
        const validatedRow = validateCsvRow(row);
        if (validatedRow) {
          validatedData.push(validatedRow);
        } else {
          errors.push(`Row ${index + 1}: Invalid data format`);
        }
      });

      if (validatedData.length === 0) {
        throw new Error('No valid rows found in CSV file');
      }

      if (errors.length > 0) {
        console.warn('CSV validation warnings:', errors);
      }

      setCsvData(validatedData);
      calculateResults(validatedData);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error processing CSV file: ${err.message}`);
      } else {
        setError(`An unknown error occurred: ${err}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateResults = (data: ProductData[]): void => {
    const validateNumericValue = (
      value: number | undefined,
      defaultValue: number,
    ): number => {
      return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
    };
    if (!data || data.length === 0) {
      setError('No valid data to calculate');
      return;
    }

    const calculated = data.map((item: ProductData) => {
      // Validate and sanitize input values
      const validatedPrice = validateNumericValue(item.price, 25);
      const validatedCost = validateNumericValue(item.cost, 0);
      const validatedFees = validateNumericValue(item.fees, 0);

      const productScore = AmazonAlgorithms.calculateProductScore({
        reviews: item.reviews || undefined,
        rating: item.reviewRating || 4.5,
        salesRank: item.salesRank || 1000,
        price: validatedPrice,
        category: ProductCategory.STANDARD,
      });

      const adjustedPrice = AmazonAlgorithms.calculateOptimalPrice({
        currentPrice: validatedPrice,
        competitorPrices: item.competitorPrices || [
          validatedPrice * 0.9,
          validatedPrice * 1.1,
        ],
        productScore: productScore / 100,
      });

      // Calculate financial metrics with validated values
      const profit = adjustedPrice - validatedCost - validatedFees;
      const margin = validatedPrice > 0 ? (profit / validatedPrice) * 100 : 0;
      const roi = validatedCost > 0 ? (profit / validatedCost) * 100 : 0;
      return {
        ...item,
        profit,
        margin: parseFloat(margin.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
      };
    });

    if (calculated.length === 0) {
      setError('Failed to calculate results');
      return;
    }

    setResults(calculated);
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(undefined);

    if (!manualProduct.product.trim()) {
      setError('Please enter a product name');
      return;
    }

    const cost = Number(manualProduct.cost);
    const price = Number(manualProduct.price);
    const fees = Number(manualProduct.fees);

    if (isNaN(cost) || cost <= 0) {
      setError('Product cost must be a valid positive number');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Selling price must be a valid positive number');
      return;
    }

    if (isNaN(fees) || fees < 0) {
      setError('Fees must be a valid non-negative number');
      return;
    }

    if (price <= cost + fees) {
      setError(
        'Selling price must be greater than the sum of cost and fees for a profitable margin',
      );
      return;
    }

    const newProduct = {
      product: manualProduct.product.trim(),
      cost,
      price,
      fees,
    };

    calculateResults([newProduct]);
    setManualProduct({ product: '', cost: 0, price: 0, fees: 0 });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Profit Margin Calculator</h2>

        <div className="mb-8">
          <CsvUploader
            onUploadSuccess={handleFileUpload}
            isLoading={isLoading}
            onClear={() => {
              setCsvData([]);
              setResults([]);
            }}
            hasData={csvData.length > 0}
          />
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product Name</Label>
              <Input
                id="product"
                name="product"
                value={manualProduct.product}
                onChange={(e) =>
                  setManualProduct((prev) => ({
                    ...prev,
                    product: e.target.value,
                  }))
                }
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Product Cost ($)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={manualProduct.cost}
                onChange={(e) =>
                  setManualProduct((prev) => ({
                    ...prev,
                    cost: Number(e.target.value),
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Selling Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={manualProduct.price}
                onChange={(e) =>
                  setManualProduct((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees">Amazon Fees ($)</Label>
              <Input
                id="fees"
                name="fees"
                type="number"
                step="0.01"
                min="0"
                value={manualProduct.fees}
                onChange={(e) =>
                  setManualProduct((prev) => ({
                    ...prev,
                    fees: Number(e.target.value),
                  }))
                }
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Calculate Profit Margin
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Calculation Results</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Cost ($)</TableHead>
                    <TableHead>Price ($)</TableHead>
                    <TableHead>Fees ($)</TableHead>
                    <TableHead>Profit ($)</TableHead>
                    <TableHead>Margin (%)</TableHead>
                    <TableHead>ROI (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={`${result.product}-${index}`}>
                      <TableCell>{result.product}</TableCell>
                      <TableCell>{result.cost.toFixed(2)}</TableCell>
                      <TableCell>{result.price?.toFixed(2)}</TableCell>
                      <TableCell>{result.fees.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        {result.profit?.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.margin?.toFixed(2)}%
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.roi?.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
