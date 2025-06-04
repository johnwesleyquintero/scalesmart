'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Interface for props of a tool category section
interface ToolCategorySectionProps {
  title: string;
  defaultValue: string;
  tabs: {
    triggerValue: string;
    triggerText: string;
    contentValue: string;
    ContentComponent: React.ComponentType<Record<string, unknown>>; // Updated from 'any'
    contentProps?: Record<string, unknown>; // Updated from 'any'
  }[];
}

/**
 * `ToolCategorySection` is a reusable component for rendering a section of Amazon Seller Tools.
 * It provides a consistent structure for tool categories, including a card, title, and nested tabs
 * for individual tools within that category.
 *
 * @param {ToolCategorySectionProps} props - The props for the component.
 * @param {string} props.title - The title of the tool category section (e.g., "Keyword Tools").
 * @param {string} props.defaultValue - The default active tab for the nested tabs.
 * @param {Array<{ triggerValue: string; triggerText: string; contentValue: string; ContentComponent: React.ComponentType<any>; contentProps?: Record<string, any> }>} props.tabs - An array of tab configurations.
 *   Each configuration includes:
 *     - `triggerValue`: The value for the `TabsTrigger`.
 *     - `triggerText`: The display text for the `TabsTrigger`.
 *     - `contentValue`: The value for the `TabsContent`.
 *     - `ContentComponent`: The React component to render within the `TabsContent`.
 *     - `contentProps`: Optional props to pass to the `ContentComponent`.
 *
 * @returns {JSX.Element} A pre-styled card component with a tabbed interface for tools.
 */
const ToolCategorySection: React.FC<ToolCategorySectionProps> = ({
  title,
  defaultValue,
  tabs,
}) => (
  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
    <CardContent className="p-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <Tabs defaultValue={defaultValue} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-gray-100 dark:bg-gray-700">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.triggerValue}
              value={tab.triggerValue}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              {tab.triggerText}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.contentValue} value={tab.contentValue}>
            {/* Mount component only when tab is active */}
            {defaultValue ===
              tab.contentValue /* Check if it's the default tab */ ||
            (typeof window !== 'undefined' && // Check if window is defined for client-side rendering
              window.location.search.includes(`tab=${tab.triggerValue}`)) ? ( // Check if it matches the URL tab param
              <tab.ContentComponent {...tab.contentProps} />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </CardContent>
  </Card>
);

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

// Keep static imports for smaller, non-tab components
import DashboardHeader from '@/components/amazon-seller-tools/DashboardHeader';
import OverviewTab from '@/components/amazon-seller-tools/OverviewTab';
import { WhatsNewModal } from '@/components/amazon-seller-tools/WhatsNewModal';
import { exportToCSV } from '@/lib/amazon-tools/export-utils'; // Import exportToCSV

// Import types
import type { DashboardMetrics } from '@/lib/amazon-tools/types';
import type { TargetMetricConfig } from '@/lib/amazon-tools/types';
import { TARGET_METRICS_CONFIG_RAW as TARGET_METRICS_CONFIG } from '@/config/amazon-tools-config';

/**
 * `UnifiedDashboard` is the main page component for the Amazon Seller Tools.
 * It manages the state for various seller tools, handles tab navigation based on URL parameters,
 * and orchestrates the dynamic loading of individual tool components.
 *
 * @returns {JSX.Element} The Amazon Seller Tools Dashboard page.
 */
export default function UnifiedDashboard() {
  const searchParams = useSearchParams();

  // State for the main tabs (synced with URL)
  const [activeTab, setActiveTab] = useState('overview');

  // States for OverviewTab data handling (kept here as they relate to core dashboard data)
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMapping, setIsMapping] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering metrics

  // States for initial tool parameters (from URL)
  const [initialAsin, setInitialAsin] = useState<string | null>(null);
  const [initialKeyword, setInitialKeyword] = useState<string | null>(null);

  // State for the "What's New" modal
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  /**
   * Effect hook to check if the "What's New" modal has been seen.
   * If not, it sets the `showWhatsNew` state to true and stores a flag in localStorage.
   */
  useEffect(() => {
    // Use a versioned key for localStorage
    const localStorageKey = 'hasSeenWhatsNew_v1.0';
    const hasSeenWhatsNew = localStorage.getItem(localStorageKey);
    if (!hasSeenWhatsNew) {
      setShowWhatsNew(true);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Effect hook to synchronize the active tab and initial tool parameters (ASIN, Keyword)
   * with the URL search parameters.
   *
   * @remarks This allows deep linking to specific tabs or pre-filling tool inputs.
   */
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
    // Dependency array includes searchParams to react to URL changes
  }, [searchParams]);

  /**
   * Handles the closing of the "What's New" modal.
   * Sets `showWhatsNew` to false and marks the modal as seen in `localStorage`.
   */
  const handleCloseWhatsNew = () => {
    const localStorageKey = 'hasSeenWhatsNew_v1.0';
    setShowWhatsNew(false);
    localStorage.setItem(localStorageKey, 'true'); // Mark as seen
  };

  /**
   * Resets all relevant state variables to their initial values.
   * This is used to refresh the dashboard or clear previous data/errors.
   *
   * @remarks This callback is memoized using `useCallback` to prevent unnecessary re-renders.
   * @returns {void}
   */
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
  }, []); // Dependencies removed as setters are stable

  /**
   * Handles the data export functionality.
   * Exports the current metrics data to a CSV file.
   * @remarks This callback is memoized using `useCallback`.
   * @returns {void}
   */
  /**
   * Handles the data export functionality.
   * Exports the current metrics data to a CSV file after transforming it.
   * @remarks This callback is memoized using `useCallback`.
   * @returns {void}
   */
  const handleExport = useCallback(() => {
    if (metrics.length > 0) {
      // Transform metrics to a format compatible with exportToCSV
      const exportableMetrics = metrics.map((metric) => {
        const exportableMetric: {
          [key: string]: string | number | boolean | null | undefined;
        } = {};
        for (const key in metric) {
          if (Object.prototype.hasOwnProperty.call(metric, key)) {
            const value = metric[key as keyof DashboardMetrics]; // Access value with type assertion
            // Convert non-primitive types to string for CSV compatibility
            if (typeof value === 'object' && value !== null) {
              exportableMetric[key] = JSON.stringify(value);
            } else {
              exportableMetric[key] = value as
                | string
                | number
                | boolean
                | null
                | undefined; // Cast primitive types
            }
          }
        }
        return exportableMetric;
      });

      exportToCSV(exportableMetrics, 'amazon_seller_tools_data.csv');
      setError(null); // Clear any previous export error
    } else {
      setError('No data available to export.');
    }
  }, [metrics]); // Dependency array includes metrics

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold my-6 text-center text-gray-900 dark:text-gray-100">
          Amazon Seller Tools Dashboard
        </h1>
        <div className="text-lg text-muted-foreground text-center mb-8 min-h-[3rem] flex items-center justify-center">
          <span className="sr-only">
            Access a suite of tools designed to help Amazon sellers analyze
            data, optimize listings, and improve performance.
          </span>
          Access a suite of tools designed to help Amazon sellers analyze data,
          optimize listings, and improve performance.
        </div>
        <DashboardHeader
          isLoading={isLoading}
          isParsing={isParsing}
          error={error}
          metricsLength={metrics.length}
          handleRefresh={handleRefresh}
          handleExport={handleExport}
          metrics={metrics}
          onSearch={setSearchTerm}
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-gray-100 dark:bg-gray-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="keywords"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Keywords
            </TabsTrigger>
            <TabsTrigger
              value="listing-optimization"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Listing Optimization
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Financials
            </TabsTrigger>
            <TabsTrigger
              value="ppc-ads"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              PPC & Ads
            </TabsTrigger>
            <TabsTrigger
              value="competition"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Competition
            </TabsTrigger>
          </TabsList>
          {/* Use conditional rendering or potentially move this logic into the OverviewTab component */}
          {activeTab === 'overview' && (
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
          )}

          {/* Render other tabs using ToolCategorySection */}
          {activeTab === 'keywords' && (
            <TabsContent value="keywords">
              <ToolCategorySection
                title="Keyword Tools"
                defaultValue="analyzer"
                tabs={[
                  {
                    triggerValue: 'analyzer',
                    triggerText: 'Analyzer',
                    contentValue: 'analyzer',
                    ContentComponent: KeywordAnalyzer,
                    contentProps: { initialKeyword },
                  },
                  {
                    triggerValue: 'deduplicator',
                    triggerText: 'Deduplicator',
                    contentValue: 'deduplicator',
                    ContentComponent: KeywordDeduplicator,
                  },
                  {
                    triggerValue: 'trend',
                    triggerText: 'Trend Analyzer',
                    contentValue: 'trend',
                    ContentComponent: KeywordTrendAnalyzer,
                  },
                ]}
              />
            </TabsContent>
          )}

          {activeTab === 'listing-optimization' && (
            <TabsContent value="listing-optimization">
              <ToolCategorySection
                title="Listing Optimization Tools"
                defaultValue="editor"
                tabs={[
                  {
                    triggerValue: 'editor',
                    triggerText: 'Description Editor',
                    contentValue: 'editor',
                    ContentComponent: DescriptionEditor,
                  },
                  {
                    triggerValue: 'quality',
                    triggerText: 'Quality Checker',
                    contentValue: 'quality',
                    ContentComponent: ListingQualityChecker,
                  },
                  {
                    triggerValue: 'score',
                    triggerText: 'Score Calculator',
                    contentValue: 'score',
                    ContentComponent: ProductScoreCalculator,
                  },
                ]}
              />
            </TabsContent>
          )}

          {activeTab === 'financials' && (
            <TabsContent value="financials">
              <ToolCategorySection
                title="Financial Tools"
                defaultValue="fba"
                tabs={[
                  {
                    triggerValue: 'fba',
                    triggerText: 'FBA Calculator',
                    contentValue: 'fba',
                    ContentComponent: FbaCalculator,
                  },
                  {
                    triggerValue: 'acos',
                    triggerText: 'ACoS Calculator',
                    contentValue: 'acos',
                    ContentComponent: AcosCalculator,
                  },
                  {
                    triggerValue: 'profit',
                    triggerText: 'Profit Margin Calc',
                    contentValue: 'profit',
                    ContentComponent: ProfitMarginCalculator,
                  },
                  {
                    triggerValue: 'price',
                    triggerText: 'Optimal Price Calc',
                    contentValue: 'price',
                    ContentComponent: OptimalPriceCalculator,
                  },
                ]}
              />
            </TabsContent>
          )}

          {activeTab === 'ppc-ads' && (
            <TabsContent value="ppc-ads">
              <ToolCategorySection
                title="PPC & Ads Tools"
                defaultValue="auditor"
                tabs={[
                  {
                    triggerValue: 'auditor',
                    triggerText: 'Campaign Auditor',
                    contentValue: 'auditor',
                    ContentComponent: PpcCampaignAuditor,
                  },
                ]}
              />
            </TabsContent>
          )}

          {activeTab === 'competition' && (
            <TabsContent value="competition">
              <ToolCategorySection
                title="Competition Tools"
                defaultValue="analyzer"
                tabs={[
                  {
                    triggerValue: 'analyzer',
                    triggerText: 'Competitor Analyzer',
                    contentValue: 'analyzer',
                    ContentComponent: CompetitorAnalyzer,
                    contentProps: { initialAsin },
                  },
                  {
                    triggerValue: 'estimator',
                    triggerText: 'Sales Estimator',
                    contentValue: 'estimator',
                    ContentComponent: SalesEstimator,
                  },
                ]}
              />
            </TabsContent>
          )}
        </Tabs>
        <WhatsNewModal
          isOpen={showWhatsNew}
          onCloseAction={handleCloseWhatsNew}
        />
      </div>
    </div>
  );
}
