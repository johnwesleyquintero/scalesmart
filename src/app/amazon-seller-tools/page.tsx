'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import tab components
const AcosCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/acos-calculator'),
  { ssr: false },
);
const CompetitorAnalyzer = dynamic(
  () =>
    import('@/components/amazon-seller-tools/competitor-analyzer').then(
      (mod) => mod.CompetitorAnalyzer,
    ),
  { ssr: false },
);
const DescriptionEditor = dynamic(
  () => import('@/components/amazon-seller-tools/description-editor'),
  { ssr: false },
);
const FbaCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/fba-calculator'),
  { ssr: false },
);
const KeywordAnalyzer = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-analyzer'),
  { ssr: false },
);
const KeywordDeduplicator = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-deduplicator'),
  { ssr: false },
);
const KeywordTrendAnalyzer = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-trend-analyzer'),
  { ssr: false },
);
const ListingQualityChecker = dynamic(
  () => import('@/components/amazon-seller-tools/listing-quality-checker'),
  { ssr: false },
);
const OptimalPriceCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/optimal-price-calculator'),
  { ssr: false },
);
const PpcCampaignAuditor = dynamic(
  () => import('@/components/amazon-seller-tools/ppc-campaign-auditor'),
  { ssr: false },
);
const ProductScoreCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/product-score-calculator'),
  { ssr: false },
);
const ProfitMarginCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/profit-margin-calculator'),
  { ssr: false },
);
const SalesEstimator = dynamic(
  () => import('@/components/amazon-seller-tools/sales-estimator'),
  { ssr: false },
);

// Keep static imports for smaller, non-tab components that are always rendered or not a primary target for lazy loading based on the prompt's focus
import DashboardHeader from '@/components/amazon-seller-tools/DashboardHeader';
import OverviewTab from '@/components/amazon-seller-tools/OverviewTab';

import { WhatsNewModal } from '@/components/amazon-seller-tools/WhatsNewModal';
import {
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
} from '@/data/amazon-tools-sample-data/amazon-dashboard-sample-data';

import { DashboardMetrics, TargetMetricConfig } from '@/lib/amazon-tools/types';
import { TARGET_METRICS_CONFIG_RAW as TARGET_METRICS_CONFIG } from '@/config/amazon-tools-config';

import type { CsvColumnMapping } from '@/types/data-mapping';

// --- Helper Functions for Data Processing ---
export default function UnifiedDashboard() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMapping, setIsMapping] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialAsin, setInitialAsin] = useState<string | null>(null);
  const [initialKeyword, setInitialKeyword] = useState<string | null>(null);

  useEffect(() => {
    const hasSeenWhatsNew = localStorage.getItem('hasSeenWhatsNew_v1.0'); // Use a versioned key
    if (!hasSeenWhatsNew) {
      setShowWhatsNew(true);
    }
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const asinParam = searchParams.get('asin');
    const keywordParam = searchParams.get('keyword');

    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (asinParam) {
      setInitialAsin(asinParam);
    }
    if (keywordParam) {
      setInitialKeyword(keywordParam);
    }
  }, [searchParams]);

  const handleCloseWhatsNew = () => {
    setShowWhatsNew(false);
    localStorage.setItem('hasSeenWhatsNew_v1.0', 'true'); // Mark as seen
  };

  const handleRefresh = useCallback(() => {
    setMetrics([]);
    setError(null);
    setIsLoading(false);
    setIsParsing(false);
    setIsUploading(false);
    setIsMapping(false);
    setIsProcessing(false);
    setSearchTerm('');
    setInitialAsin(null);
    setInitialKeyword(null);
  }, [
    setMetrics,
    setError,
    setIsLoading,
    setIsParsing,
    setIsUploading,
    setIsMapping,
    setIsProcessing,
    setSearchTerm,
    setInitialAsin,
    setInitialKeyword,
  ]);

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
        metrics={metrics}
        onSearch={setSearchTerm}
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
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            isMapping={isMapping}
            setIsMapping={setIsMapping}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            error={error}
            setError={setError}
            TARGET_METRICS_CONFIG={TARGET_METRICS_CONFIG}
            searchTerm={searchTerm}
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
                  <KeywordAnalyzer initialKeyword={initialKeyword} />
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
                  <CompetitorAnalyzer initialAsin={initialAsin} />
                </TabsContent>
                <TabsContent value="estimator">
                  <SalesEstimator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <WhatsNewModal
        isOpen={showWhatsNew}
        onCloseAction={handleCloseWhatsNew}
      />
    </div>
  );
}
