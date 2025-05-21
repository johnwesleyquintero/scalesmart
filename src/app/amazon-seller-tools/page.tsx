'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useCallback, useState } from 'react';
import AcosCalculator from '@/components/amazon-seller-tools/acos-calculator';
import { CompetitorAnalyzer } from '@/components/amazon-seller-tools/competitor-analyzer';
import DescriptionEditor from '@/components/amazon-seller-tools/description-editor';
import FbaCalculator from '@/components/amazon-seller-tools/fba-calculator';
import KeywordAnalyzer from '@/components/amazon-seller-tools/keyword-analyzer';
import KeywordDeduplicator from '@/components/amazon-seller-tools/keyword-deduplicator';
import KeywordTrendAnalyzer from '@/components/amazon-seller-tools/keyword-trend-analyzer';
import ListingQualityChecker from '@/components/amazon-seller-tools/listing-quality-checker';
import OptimalPriceCalculator from '@/components/amazon-seller-tools/optimal-price-calculator';
import PpcCampaignAuditor from '@/components/amazon-seller-tools/ppc-campaign-auditor';
import ProductScoreCalculator from '@/components/amazon-seller-tools/product-score-calculator';
import ProfitMarginCalculator from '@/components/amazon-seller-tools/profit-margin-calculator';
import SalesEstimator from '@/components/amazon-seller-tools/sales-estimator';
import DashboardHeader from '@/components/amazon-seller-tools/DashboardHeader';
import OverviewTab from '@/components/amazon-seller-tools/OverviewTab';
import sampleData from '@/data/sample-data.json';

// --- Interface ---
// Define DashboardMetrics interface ONCE
export interface DashboardMetrics {
  date: string; // YYYY-MM-DD
  unique_identifier?: string; // ASIN, SKU, etc.
  total_sales?: number;
  total_orders?: number;
  total_sessions?: number;
  total_page_views?: number;
  total_conversion_rate?: number;
  ad_impressions?: number;
  ad_clicks?: number;
  ad_spend?: number;
  ad_sales?: number;
  ad_orders?: number;
  acos?: number;
  roas?: number;
  cpc?: number;
  ctr?: number;
  ad_conversion_rate?: number;
  profit?: number;
  inventory_level?: number;
  review_rating?: number;
  cac?: number;
  ltv?: number;
  [key: string]: unknown;
}

import type { CsvColumnMapping } from '@/types/data-mapping';

// --- Target Metrics for Mapper ---
export interface TargetMetricConfig {
  key: keyof DashboardMetrics;
  label: string;
  required: boolean;
  expectedType: 'string' | 'number' | 'date' | 'boolean';
  hint?: string;
  group?: string;
}

import { TARGET_METRICS_CONFIG_RAW } from '@/config/amazon-tools-config';

const TARGET_METRICS_CONFIG = TARGET_METRICS_CONFIG_RAW;

// --- Helper Functions for Data Processing ---
export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  }, [setIsLoading, setError]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold my-6 text-center">
        Amazon Seller Tools Dashboard
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Access a suite of tools designed to help Amazon sellers analyze data,
        optimize listings, and improve performance.
      </p>
      <DashboardHeader
        isLoading={isLoading}
        isParsing={isParsing}
        error={error}
        metricsLength={metrics.length}
        handleRefresh={handleRefresh}
        handleExport={() => setError('No data to export.')}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="listing-optimization">
            Listing Optimization
          </TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="ppc-ads">PPC & Ads</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 mt-4">
          <OverviewTab
            metrics={metrics}
            setMetrics={setMetrics}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isParsing={isParsing}
            setIsParsing={setIsParsing}
            error={error}
            setError={setError}
            TARGET_METRICS_CONFIG={TARGET_METRICS_CONFIG}
          />
        </TabsContent>
        <TabsContent value="keywords">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Keyword Tools</h3>
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
                  <TabsTrigger value="deduplicator">Deduplicator</TabsTrigger>
                  <TabsTrigger value="trend">Trend Analyzer</TabsTrigger>
                </TabsList>
                <TabsContent value="analyzer">
                  <KeywordAnalyzer />
                </TabsContent>
                <TabsContent value="deduplicator">
                  <KeywordDeduplicator />
                </TabsContent>
                <TabsContent value="trend">
                  <KeywordTrendAnalyzer />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="listing-optimization">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">
                Listing Optimization Tools
              </h3>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">Description Editor</TabsTrigger>
                  <TabsTrigger value="quality">Quality Checker</TabsTrigger>
                  <TabsTrigger value="score">Score Calculator</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <DescriptionEditor />
                </TabsContent>
                <TabsContent value="quality">
                  <ListingQualityChecker />
                </TabsContent>
                <TabsContent value="score">
                  <ProductScoreCalculator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financials">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Financial Tools</h3>
              <Tabs defaultValue="fba" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="fba">FBA Calculator</TabsTrigger>
                  <TabsTrigger value="acos">ACoS Calculator</TabsTrigger>
                  <TabsTrigger value="profit">Profit Margin Calc</TabsTrigger>
                  <TabsTrigger value="price">Optimal Price Calc</TabsTrigger>
                </TabsList>
                <TabsContent value="fba">
                  <FbaCalculator />
                </TabsContent>
                <TabsContent value="acos">
                  <AcosCalculator />
                </TabsContent>
                <TabsContent value="profit">
                  <ProfitMarginCalculator />
                </TabsContent>
                <TabsContent value="price">
                  <OptimalPriceCalculator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ppc-ads">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">PPC & Ads Tools</h3>
              <Tabs defaultValue="auditor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="auditor">Campaign Auditor</TabsTrigger>
                </TabsList>
                <TabsContent value="auditor">
                  <PpcCampaignAuditor />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="competition">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Competition Tools</h3>
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">
                    Competitor Analyzer
                  </TabsTrigger>
                  <TabsTrigger value="estimator">Sales Estimator</TabsTrigger>
                </TabsList>
                <TabsContent value="analyzer">
                  <CompetitorAnalyzer />
                </TabsContent>
                <TabsContent value="estimator">
                  <SalesEstimator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
