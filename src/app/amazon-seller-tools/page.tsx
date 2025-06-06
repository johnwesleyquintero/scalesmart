/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// UI Components from shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Custom Components
import DashboardHeader from '@/components/amazon-seller-tools/DashboardHeader';
import OverviewTab from '@/components/amazon-seller-tools/OverviewTab';
import { WhatsNewModal } from '@/components/amazon-seller-tools/WhatsNewModal';

// Utility & Config
import { exportToCSV } from '@/lib/amazon-tools/export-utils';
import { TARGET_METRICS_CONFIG } from '@/config/amazon-tools-config';

// Types
import type { DashboardMetrics } from '@/lib/amazon-tools/types';
import type { TargetMetricConfig } from '@/lib/amazon-tools/types';

/**
 * Type for a single tab configuration within a ToolCategorySection.
 * Uses React.ComponentType for better type safety.
 */
interface ToolCategoryTab {
  triggerValue: string;
  triggerText: string;
  contentValue: string;
  Component: React.ComponentType<any>; // Using 'any' here as component props vary widely
  componentProps?: Record<string, any>; // Using 'any' here as component props vary widely
}

/**
 * Interface for props of a tool category section component.
 */
interface ToolCategorySectionProps {
  title: string;
  defaultValue: string;
  tabs: ToolCategoryTab[];
}

/**
 * `ToolCategorySection` is a reusable component for rendering a section of Amazon Seller Tools.
 * It provides a consistent structure for tool categories, including a card, title, and nested tabs
 * for individual tools within that category.
 *
 * @param {ToolCategorySectionProps} props - The props for the component.
 * @param {string} props.title - The title of the tool category section (e.g., "Keyword Tools").
 * @param {string} props.defaultValue - The default active tab for the nested tabs.
 * @param {ToolCategoryTab[]} props.tabs - An array of tab configurations.
 *   Each configuration includes:
 *     - `triggerValue`: The value for the `TabsTrigger`.
 *     - `triggerText`: The display text for the `TabsTrigger`.
 *     - `contentValue`: The value for the `TabsContent`.
 *     - `Component`: The React component to render within the `TabsContent`.
 *     - `componentProps`: Optional props to pass to the `Component`.
 *
 * @returns {JSX.Element} A pre-styled card component with a tabbed interface for tools.
 */
const ToolCategorySection: React.FC<ToolCategorySectionProps> = React.memo(
  ({ title, defaultValue, tabs }) => (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {/* Use key prop on Tabs for proper reset if the structure changes, though unlikely here */}
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
            // TabsContent handles rendering its children only when active
            <TabsContent
              key={tab.contentValue}
              value={tab.contentValue}
              className="mt-0"
            >
              <tab.Component {...tab.componentProps} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  ),
);

ToolCategorySection.displayName = 'ToolCategorySection';

// Dynamically import tab components with SSR disabled
const AcosCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/acos-calculator'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading ACoS Calculator...</div>,
  },
);
const CompetitorAnalyzer = dynamic(
  () =>
    import('@/components/amazon-seller-tools/competitor-analyzer').then(
      (mod) => mod.CompetitorAnalyzer,
    ),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Competitor Analyzer...</div>,
  },
);
const DescriptionEditor = dynamic(
  () => import('@/components/amazon-seller-tools/description-editor'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Description Editor...</div>,
  },
);
const FbaCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/fba-calculator'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading FBA Calculator...</div>,
  },
);
const KeywordAnalyzer = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-analyzer'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Keyword Analyzer...</div>,
  },
);
const KeywordDeduplicator = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-deduplicator'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Keyword Deduplicator...</div>,
  },
);
const KeywordTrendAnalyzer = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-trend-analyzer'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Keyword Trend Analyzer...</div>,
  },
);
const ListingQualityChecker = dynamic(
  () => import('@/components/amazon-seller-tools/listing-quality-checker'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Listing Quality Checker...</div>
    ),
  },
);
const OptimalPriceCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/optimal-price-calculator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Optimal Price Calculator...</div>
    ),
  },
);
const PpcCampaignAuditor = dynamic(
  () => import('@/components/amazon-seller-tools/ppc-campaign-auditor'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading PPC Campaign Auditor...</div>,
  },
);
const ProductScoreCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/product-score-calculator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Product Score Calculator...</div>
    ),
  },
);
const ProfitMarginCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/profit-margin-calculator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Profit Margin Calculator...</div>
    ),
  },
);
const SalesEstimator = dynamic(
  () => import('@/components/amazon-seller-tools/sales-estimator'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Sales Estimator...</div>,
  },
);

// Define tab structures as constants outside the component
const MAIN_TABS = [
  { value: 'overview', triggerText: 'Overview' },
  { value: 'keywords', triggerText: 'Keywords' },
  { value: 'listing-optimization', triggerText: 'Listing Optimization' },
  { value: 'financials', triggerText: 'Financials' },
  { value: 'ppc-ads', triggerText: 'PPC & Ads' },
  { value: 'competition', triggerText: 'Competition' },
];

const KEYWORD_TOOL_TABS: ToolCategoryTab[] = [
  {
    triggerValue: 'analyzer',
    triggerText: 'Analyzer',
    contentValue: 'analyzer',
    Component: KeywordAnalyzer,
  },
  {
    triggerValue: 'deduplicator',
    triggerText: 'Deduplicator',
    contentValue: 'deduplicator',
    Component: KeywordDeduplicator,
  },
  {
    triggerValue: 'trend',
    triggerText: 'Trend Analyzer',
    contentValue: 'trend',
    Component: KeywordTrendAnalyzer,
  },
];

const LISTING_OPTIMIZATION_TOOL_TABS: ToolCategoryTab[] = [
  {
    triggerValue: 'editor',
    triggerText: 'Description Editor',
    contentValue: 'editor',
    Component: DescriptionEditor,
  },
  {
    triggerValue: 'quality',
    triggerText: 'Quality Checker',
    contentValue: 'quality',
    Component: ListingQualityChecker,
  },
  {
    triggerValue: 'score',
    triggerText: 'Score Calculator',
    contentValue: 'score',
    Component: ProductScoreCalculator,
  },
];

const FINANCIAL_TOOL_TABS: ToolCategoryTab[] = [
  {
    triggerValue: 'fba',
    triggerText: 'FBA Calculator',
    contentValue: 'fba',
    Component: FbaCalculator,
  },
  {
    triggerValue: 'acos',
    triggerText: 'ACoS Calculator',
    contentValue: 'acos',
    Component: AcosCalculator,
  },
  {
    triggerValue: 'profit',
    triggerText: 'Profit Margin Calc',
    contentValue: 'profit',
    Component: ProfitMarginCalculator,
  },
  {
    triggerValue: 'price',
    triggerText: 'Optimal Price Calc',
    contentValue: 'price',
    Component: OptimalPriceCalculator,
  },
];

const PPC_ADS_TOOL_TABS: ToolCategoryTab[] = [
  {
    triggerValue: 'auditor',
    triggerText: 'Campaign Auditor',
    contentValue: 'auditor',
    Component: PpcCampaignAuditor,
  },
];

const COMPETITION_TOOL_TABS: ToolCategoryTab[] = [
  {
    triggerValue: 'analyzer',
    triggerText: 'Competitor Analyzer',
    contentValue: 'analyzer',
    Component: CompetitorAnalyzer,
  },
  {
    triggerValue: 'estimator',
    triggerText: 'Sales Estimator',
    contentValue: 'estimator',
    Component: SalesEstimator,
  },
];

/**
 * `UnifiedDashboard` is the main page component for the Amazon Seller Tools.
 * It manages the state for various seller tools, handles tab navigation based on URL parameters,
 * and orchestrates the dynamic loading of individual tool components.
 *
 * @returns {JSX.Element} The Amazon Seller Tools Dashboard page.
 */
export default function UnifiedDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for the main tabs (synced with URL)
  const [activeTab, setActiveTab] = useState('overview');

  // States for OverviewTab data handling (kept here for DashboardHeader and export)
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering metrics

  // States for initial tool parameters (from URL)
  const [initialAsin, setInitialAsin] = useState<string | null>(null);
  const [initialKeyword, setInitialKeyword] = useState<string | null>(null);

  // State for the "What's New" modal
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Effect hook to check if the "What's New" modal has been seen.
  useEffect(() => {
    const localStorageKey = 'hasSeenWhatsNew_v1.0';
    const hasSeenWhatsNew =
      typeof window !== 'undefined'
        ? localStorage.getItem(localStorageKey)
        : null;
    if (!hasSeenWhatsNew) {
      setShowWhatsNew(true);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect hook to synchronize the active tab and initial tool parameters (ASIN, Keyword)
  // with the URL search parameters when searchParams change.
  useEffect(() => {
    const tabParam = searchParams.get('tab') || 'overview';
    setActiveTab(tabParam);

    // Extract and store initial params if present
    const asinParam = searchParams.get('asin');
    const keywordParam = searchParams.get('keyword');
    setInitialAsin(asinParam);
    setInitialKeyword(keywordParam);

    // Clean up initial params after consumption if needed by specific tools
    // Or let the tool components handle state derived from props
    // For now, we keep them in state to pass down.
  }, [searchParams]); // Dependency array includes searchParams to react to URL changes

  /**
   * Handles the closing of the "What's New" modal.
   * Sets `showWhatsNew` to false and marks the modal as seen in `localStorage`.
   */
  const handleCloseWhatsNew = useCallback(() => {
    const localStorageKey = 'hasSeenWhatsNew_v1.0';
    setShowWhatsNew(false);
    // Check window before accessing localStorage for SSR compatibility (though this is client-only)
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, 'true');
    }
  }, []);

  /**
   * Resets all relevant state variables to their initial values.
   * This is used to refresh the dashboard or clear previous data/errors.
   * Memoized to prevent unnecessary re-renders.
   */
  const handleRefresh = useCallback(() => {
    setMetrics([]);
    setError(null);
    setIsLoading(false);
    setIsParsing(false);
    setSearchTerm('');
    // Reset initial params as well on refresh? Depends on desired behavior.
    // Let's keep them as they might relate to the current URL state.
    // setInitialAsin(null);
    // setInitialKeyword(null);
  }, []); // Dependencies removed as setters are stable

  /**
   * Handles the data export functionality.
   * Exports the current metrics data to a CSV file after transforming it.
   * Memoized using `useCallback`.
   */
  const handleExport = useCallback(() => {
    if (metrics.length === 0) {
      setError('No data available to export.');
      return;
    }

    // Transform metrics to a format compatible with exportToCSV
    const exportableMetrics = metrics.map((metric) => {
      const exportableMetric: {
        [key: string]: string | number | boolean | null | undefined;
      } = {};
      // Iterate over keys of DashboardMetrics
      for (const key in metric) {
        // Use Object.prototype.hasOwnProperty.call for safer iteration
        if (Object.prototype.hasOwnProperty.call(metric, key)) {
          const value = metric[key as keyof DashboardMetrics];
          // Convert non-primitive types to string for CSV compatibility
          if (typeof value === 'object' && value !== null) {
            // Simple stringification; might need more complex handling for nested objects/arrays
            exportableMetric[key] = JSON.stringify(value);
          } else {
            // Primitive types can be assigned directly
            exportableMetric[key] = value as
              | string
              | number
              | boolean
              | null
              | undefined;
          }
        }
      }
      return exportableMetric;
    });

    try {
      exportToCSV(exportableMetrics, 'amazon_seller_tools_data.csv');
      setError(null); // Clear any previous export error on success
    } catch (e) {
      console.error('Export failed:', e);
      setError('Failed to export data.');
    }
  }, [metrics]); // Dependency array includes metrics

  /**
   * Handles changing the main dashboard tab and updates the URL search parameter.
   * @param value The value of the tab being activated.
   */
  const handleMainTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('tab', value);
      // Consider removing specific tool params if switching away from relevant tabs?
      // Keeping them allows deep links to persist if you navigate away and back.
      router.push(`?${currentParams.toString()}`, { scroll: false });
    },
    [searchParams, router],
  ); // Depend on searchParams and router

  // Memoize the ToolCategorySection tabs data to prevent re-creation on every render
  const toolCategoryTabs = useMemo(
    () => ({
      keywords: KEYWORD_TOOL_TABS.map((tab) =>
        tab.triggerValue === 'analyzer'
          ? { ...tab, componentProps: { initialKeyword } }
          : tab,
      ),
      listingOptimization: LISTING_OPTIMIZATION_TOOL_TABS,
      financials: FINANCIAL_TOOL_TABS,
      ppcAds: PPC_ADS_TOOL_TABS,
      competition: COMPETITION_TOOL_TABS.map((tab) =>
        tab.triggerValue === 'analyzer'
          ? { ...tab, componentProps: { initialAsin } }
          : tab,
      ),
    }),
    [initialAsin, initialKeyword],
  ); // Recreate if initial params change

  // State for upload/processing specific to OverviewTab - kept here as per original code structure
  // These flags are not currently used by DashboardHeader, so ideally they'd be in OverviewTab
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMapping, setIsMapping] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold my-6 text-center text-gray-900 dark:text-gray-100">
          Amazon Seller Tools Dashboard
        </h1>
        <div className="text-lg text-muted-foreground text-center mb-8 min-h-[3rem] flex items-center justify-center">
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
          // Pass Overview specific states if needed by header (they aren't currently)
          // isUploading={isUploading}
          // isMapping={isMapping}
          // isProcessing={isProcessing}
        />

        <Tabs
          value={activeTab}
          onValueChange={handleMainTabChange}
          className="w-full"
        >
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-gray-100 dark:bg-gray-700">
            {MAIN_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
              >
                {tab.triggerText}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* OverviewTab manages its own UI and state related to file processing */}
            <OverviewTab
              metrics={metrics}
              setMetrics={setMetrics}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              isParsing={isParsing}
              setIsParsing={setIsParsing}
              isUploading={isUploading} // Pass down states managed in parent
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
            <ToolCategorySection
              title="Keyword Tools"
              defaultValue="analyzer" // Default sub-tab for this section
              tabs={toolCategoryTabs.keywords}
            />
          </TabsContent>

          <TabsContent value="listing-optimization">
            <ToolCategorySection
              title="Listing Optimization Tools"
              defaultValue="editor" // Default sub-tab for this section
              tabs={toolCategoryTabs.listingOptimization}
            />
          </TabsContent>

          <TabsContent value="financials">
            <ToolCategorySection
              title="Financial Tools"
              defaultValue="fba" // Default sub-tab for this section
              tabs={toolCategoryTabs.financials}
            />
          </TabsContent>

          <TabsContent value="ppc-ads">
            <ToolCategorySection
              title="PPC & Ads Tools"
              defaultValue="auditor" // Default sub-tab for this section
              tabs={toolCategoryTabs.ppcAds}
            />
          </TabsContent>

          <TabsContent value="competition">
            <ToolCategorySection
              title="Competition Tools"
              defaultValue="analyzer" // Default sub-tab for this section
              tabs={toolCategoryTabs.competition}
            />
          </TabsContent>
        </Tabs>

        <WhatsNewModal
          isOpen={showWhatsNew}
          onCloseAction={handleCloseWhatsNew}
        />
      </div>
    </div>
  );
}
