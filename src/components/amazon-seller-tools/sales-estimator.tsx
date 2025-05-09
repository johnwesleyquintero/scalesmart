'use client';

import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  AlertCircle,
  Download,
  FileText,
  TrendingUp,
  Upload,
} from 'lucide-react';
import Papa from 'papaparse';
import { useRef, useState } from 'react';
import { z } from 'zod';

// Zod schema for input validation
const productSchema = z.object({
  product: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  competition: z.enum(['Low', 'Medium', 'High']),
});

// Categories and their base sales values
const CATEGORIES = {
  Electronics: 150,
  'Phone Accessories': 200,
  'Home & Kitchen': 120,
  'Beauty & Personal Care': 180,
  'Sports & Outdoors': 90,
  Books: 70,
  'Toys & Games': 110,
  Clothing: 160,
  'Office Products': 100,
  'Pet Supplies': 130,
} as const;

// Price factor ranges
const PRICE_FACTORS = [
  { range: [0, 10], factor: 2.0 },
  { range: [10, 25], factor: 1.5 },
  { range: [25, 50], factor: 1.0 },
  { range: [50, Infinity], factor: 0.7 },
] as const;

// Competition factors
const COMPETITION_FACTORS = {
  Low: 1.3,
  Medium: 1.0,
  High: 0.7,
} as const;

type CompetitionLevel = 'Low' | 'Medium' | 'High';

type ProductData = {
  product: string;
  category: string;
  price: number;
  competition: 'Low' | 'Medium' | 'High';
  estimatedSales: number;
  estimatedRevenue: number;
  confidence: 'Low' | 'Medium' | 'High';
};

export default function SalesEstimator() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualProduct, setManualProduct] = useState({
    product: '',
    category: '',
    price: '',
    competition: 'Medium' as CompetitionLevel,
  });

  const getBaseSales = (category: string): number => {
    return CATEGORIES[category as keyof typeof CATEGORIES] || 100;
  };

  const getPriceFactor = (priceValue: number): number => {
    const factor = PRICE_FACTORS.find(
      ({ range }) => priceValue >= range[0] && priceValue < range[1],
    );
    return factor?.factor || 1.0;
  };

  const getCompetitionFactor = (competition: CompetitionLevel): number => {
    return COMPETITION_FACTORS[competition];
  };

  const getConfidenceLevel = (
    competition: CompetitionLevel,
    price: number,
  ): 'Low' | 'Medium' | 'High' => {
    if (competition === 'Low' && price < 30) return 'High';
    if (competition === 'High' && price > 50) return 'Low';
    return 'Medium';
  };

  const calculateSalesData = (item: {
    category: string;
    price: number;
    competition: CompetitionLevel;
  }): {
    estimatedSales: number;
    estimatedRevenue: number;
    confidence: 'Low' | 'Medium' | 'High';
  } => {
    try {
      const baseSales = getBaseSales(item.category);
      const priceFactor = getPriceFactor(item.price);
      const competitionFactor = getCompetitionFactor(item.competition);

      const estimatedSales = Math.round(
        baseSales * priceFactor * competitionFactor,
      );
      const estimatedRevenue = estimatedSales * item.price;

      return {
        estimatedSales,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
        confidence: getConfidenceLevel(item.competition, item.price),
      };
    } catch (error) {
      logger.error('Error calculating sales data', {
        error,
        item,
        component: 'SalesEstimator',
      });
      throw new Error('Failed to calculate sales data');
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await new Promise<Papa.ParseResult<any>>(
        (resolve, reject) => {
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: resolve,
            error: reject,
            transform: (value) => value.trim(),
          });
        },
      );

      if (result.errors.length > 0) {
        throw new Error(`CSV parsing error: ${result.errors[0].message}`);
      }

      const processedData = result.data
        .filter((row: any) => row.product && row.category && row.price)
        .map((row: any) => {
          const validatedData = productSchema.parse({
            product: row.product,
            category: row.category,
            price: Number(row.price),
            competition: row.competition || 'Medium',
          });

          const { estimatedSales, estimatedRevenue, confidence } =
            calculateSalesData(validatedData);

          return {
            ...validatedData,
            estimatedSales,
            estimatedRevenue,
            confidence,
          };
        });

      setProducts(processedData);
      toast({
        title: 'Success',
        description: `Processed ${processedData.length} products`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to parse CSV file. Please check the format and try again.';

      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      logger.error('CSV parsing error', {
        error,
        component: 'SalesEstimator',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualEstimate = () => {
    try {
      const validatedData = productSchema.parse({
        product: manualProduct.product,
        category: manualProduct.category,
        price: Number(manualProduct.price),
        competition: manualProduct.competition,
      });

      const { estimatedSales, estimatedRevenue, confidence } =
        calculateSalesData(validatedData);

      const newProduct: ProductData = {
        ...validatedData,
        estimatedSales,
        estimatedRevenue,
        confidence,
      };

      setProducts([...products, newProduct]);
      setManualProduct({
        product: '',
        category: '',
        price: '',
        competition: 'Medium',
      });
      setError(null);

      toast({
        title: 'Success',
        description: 'Added new product estimate',
      });
    } catch (error) {
      const errorMessage =
        error instanceof z.ZodError
          ? error.errors[0].message
          : 'Failed to add product. Please check your inputs.';

      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      logger.error('Manual estimate error', {
        error,
        input: manualProduct,
        component: 'SalesEstimator',
      });
    }
  };

  const handleExport = async () => {
    try {
      setExportProgress(0);
      const csvData = Papa.unparse(products);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `sales_estimates_${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setExportProgress(i);
      }

      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportProgress(0);

      toast({
        title: 'Success',
        description: 'Sales estimates exported successfully',
      });
    } catch (error) {
      logger.error('Export error', {
        error,
        component: 'SalesEstimator',
      });
      toast({
        title: 'Error',
        description: 'Failed to export sales estimates',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with your product data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with product name, category, price, and competition
                    level)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium">Manual Estimate</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Product Name</label>
                  <Input
                    value={manualProduct.product}
                    onChange={(e) => {
                      setManualProduct({
                        ...manualProduct,
                        product: (e.target as HTMLInputElement).value,
                      });
                    }}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={manualProduct.category}
                    onChange={(e) => {
                      setManualProduct({
                        ...manualProduct,
                        category: (e.target as HTMLInputElement).value,
                      });
                    }}
                    placeholder="Enter product category"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualProduct.price}
                    onChange={(e) => {
                      setManualProduct({
                        ...manualProduct,
                        price: (e.target as HTMLInputElement).value,
                      });
                    }}
                    placeholder="Enter product price"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Competition Level
                  </label>
                  <select
                    value={manualProduct.competition}
                    onChange={(e) => {
                      setManualProduct({
                        ...manualProduct,
                        competition: e.target.value as CompetitionLevel,
                      });
                    }}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <Button onClick={handleManualEstimate} className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Estimate Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={45} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Estimating sales potential...
          </p>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || exportProgress > 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Estimates
            </Button>
          </div>

          {exportProgress > 0 && (
            <div className="space-y-2">
              <Progress value={exportProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Exporting data... {exportProgress}%
              </p>
            </div>
          )}

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      Competition
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Est. Monthly Sales
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Est. Monthly Revenue
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 text-sm">{product.product}</td>
                      <td className="px-4 py-3 text-sm">{product.category}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={(() => {
                            if (product.competition === 'Low') {
                              return 'default';
                            } else if (product.competition === 'Medium') {
                              return 'secondary';
                            } else {
                              return 'destructive';
                            }
                          })()}
                        >
                          {product.competition}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {product.estimatedSales.toLocaleString()} units
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        ${product.estimatedRevenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          let badgeVariant:
                            | 'default'
                            | 'secondary'
                            | 'outline' = 'outline';
                          if (product.confidence === 'High')
                            badgeVariant = 'default';
                          else if (product.confidence === 'Medium')
                            badgeVariant = 'secondary';
                          return (
                            <Badge variant={badgeVariant}>
                              {product.confidence}
                            </Badge>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-2 text-sm font-medium">Estimation Methodology</h3>
            <p className="text-sm text-muted-foreground">
              These estimates are based on category averages, price points, and
              competition levels. Actual sales may vary based on additional
              factors such as listing quality, reviews, advertising, and
              seasonality. High confidence estimates are more likely to be
              accurate.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
