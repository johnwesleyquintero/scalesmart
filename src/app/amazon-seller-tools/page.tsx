'use client';

import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// UI Components from shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner'; // Import toast for user feedback

// Custom Components
import DashboardHeader from '@/components/amazon-seller-tools/DashboardHeader';
import OverviewTab from '@/components/amazon-seller-tools/OverviewTab';
import { WhatsNewModal } from '@/components/amazon-seller-tools/WhatsNewModal';
import DataIntegrationTab from '@/components/amazon-seller-tools/DataIntegrationTab'; // Import the new tab component
import { useAmazonDataIntegration } from '@/lib/hooks/useAmazonDataIntegration'; // Import the custom hook

// Utility & Config
import { exportToCSV } from '@/lib/amazon-tools/export-utils';

// Types
import type {
  DashboardMetrics,
  ValidationFlags,
  AggregatedProductMetrics,
  TimeRange,
} from '@/lib/amazon-tools/types';
import type { TargetMetricConfig } from '@/lib/amazon-tools/types';
import { TARGET_METRICS_CONFIG } from '@/config/amazon-tools-config';
import { WHATS_NEW_LOCAL_STORAGE_KEY } from '@/lib/constants'; // Import the constant

/**
 * Type for values that are compatible with CSV export (primitive types or stringified objects).
 */
type ExportCompatibleValue = string | number | boolean | null | undefined;

/**
 * Recursively flattens an object, handling nested objects and arrays for CSV export.
 * Non-primitive values are stringified. Keys are prefixed to avoid collisions.
 * @param obj The object to flatten.
 * @param prefix The prefix for the keys (used in recursion).
 * @returns A flat object with prefixed keys and export-compatible values.
 */
const flattenObjectForExport = (
  obj: Record<string, unknown>,
  prefix: string = '',
): Record<string, ExportCompatibleValue> => {
  const flattened: Record<string, ExportCompatibleValue> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    ) {
      flattened[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively flatten nested objects, ensuring the type is compatible
      Object.assign(
        flattened,
        flattenObjectForExport(value as Record<string, unknown>, newKey),
      );
    }
    // Functions, symbols, and bigints are intentionally ignored as they are not suitable for CSV.
  }
  return flattened;
};

/**
 * Transforms a single `DashboardMetrics` object into a flat object suitable for CSV export.
 * This flattens all nested objects and ensures all values are compatible with CSV export.
 * @param metric - The DashboardMetrics object to transform.
 * @returns A flat object suitable for CSV export.
 */
const transformMetricForExport = (
  metric: DashboardMetrics,
): Record<string, ExportCompatibleValue> => {
  return flattenObjectForExport(metric);
};

/**
 * Type for a single tab configuration within a ToolCategorySection.
 * @template P - The props type for the React component.
 */
interface ToolCategoryTab<P = Record<string, unknown>> {
  triggerValue: string;
  triggerText: string;
  contentValue: string;
  Component: React.ComponentType<P>;
  componentProps?: P;
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
    loading: () => <div className="p-4">Loading ACoS Calculator&hellip;</div>,
  },
);
const CompetitorAnalyzer = dynamic(
  () =>
    import('@/components/amazon-seller-tools/competitor-analyzer').then(
      (mod) => mod.CompetitorAnalyzer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Competitor Analyzer&hellip;</div>
    ),
  },
);
const DescriptionEditor = dynamic(
  () => import('@/components/amazon-seller-tools/description-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Description Editor&hellip;</div>
    ),
  },
);
const FbaCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/fba-calculator'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading FBA Calculator&hellip;</div>,
  },
);
const KeywordAnalyzer = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-analyzer'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Keyword Analyzer&hellip;</div>,
  },
);
const KeywordDeduplicator = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-deduplicator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Keyword Deduplicator&hellip;</div>
    ),
  },
);
const KeywordTrendAnalyzer = dynamic(
  () => import('@/components/amazon-seller-tools/keyword-trend-analyzer'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Keyword Trend Analyzer&hellip;</div>
    ),
  },
);
const ListingQualityChecker = dynamic(
  () => import('@/components/amazon-seller-tools/listing-quality-checker'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Listing Quality Checker&hellip;</div>
    ),
  },
);
const OptimalPriceCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/optimal-price-calculator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Optimal Price Calculator&hellip;</div>
    ),
  },
);
const PpcCampaignAuditor = dynamic(
  () => import('@/components/amazon-seller-tools/ppc-campaign-auditor'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading PPC Campaign Auditor&hellip;</div>
    ),
  },
);
const ProductScoreCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/product-score-calculator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Product Score Calculator&hellip;</div>
    ),
  },
);
const ProfitMarginCalculator = dynamic(
  () => import('@/components/amazon-seller-tools/profit-margin-calculator'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">Loading Profit Margin Calculator&hellip;</div>
    ),
  },
);
const SalesEstimator = dynamic(
  () => import('@/components/amazon-seller-tools/sales-estimator'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading Sales Estimator&hellip;</div>,
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
  { value: 'data-integration', triggerText: 'Data Integration' }, // Add new tab
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
 * `UnifiedDashboard` is the main page component for the Amazon Seller Tools platform.
 * It serves as the central hub for various seller functionalities, managing global state,
 * handling URL-based tab navigation, and dynamically loading individual tool components
 * to optimize initial page load performance.
 *
 * Key responsibilities include:
 * - **Tab Management:** Synchronizes the active tab with URL search parameters, enabling deep linking.
 * - **Data Handling:** Manages core dashboard metrics, loading, parsing, and error states,
 *   primarily for the `OverviewTab` and CSV export functionality.
 * - **Tool Parameter Initialization:** Extracts and passes initial ASIN and Keyword parameters
 *   from the URL to relevant dynamic tool components.
 * - **User Onboarding:** Displays a "What's New" modal on first visit to inform users about updates.
 * - **Data Export:** Provides functionality to export current dashboard metrics to a CSV file.
 * - **Component Orchestration:** Renders `DashboardHeader`, `OverviewTab`, and various
 *   `ToolCategorySection` components, each containing dynamically loaded seller tools.
 *
 * @returns {JSX.Element} The Amazon Seller Tools Dashboard page, providing a unified
 *   interface for sellers to analyze data, optimize listings, and improve performance.
 */
export default function UnifiedDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for the currently active main tab, synchronized with the URL search parameter 'tab'.
  const [activeTab, setActiveTab] = useState('overview');

  // State to hold all data and callbacks provided by the DataIntegrationTab component.
  // This state is updated via the `onDataUpdate` prop passed to DataIntegrationTab.
  // Use the custom hook to manage all data integration states and callbacks.
  // This centralizes data logic and simplifies the component.
  const dataIntegrationData = useAmazonDataIntegration();

  // Destructure necessary callbacks and states from the hook's return value.
  const {
    metrics,
    isLoading,
    isParsing,
    error,
    searchTerm,
    onRefreshData,
    onUploadFile,
    onLoadSampleData,
    onDownloadSampleCsv,
    setSearchTerm,
  } = dataIntegrationData;

  // States for initial tool parameters (ASIN and Keyword) extracted from the URL search parameters.
  // These are used to pre-fill inputs in specific tool components for deep linking.
  const [initialAsin, setInitialAsin] = useState<string | null>(null);
  const [initialKeyword, setInitialKeyword] = useState<string | null>(null);

  // State to control the visibility of the "What's New" modal.
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  /**
   * Effect hook to check if the "What's New" modal has been seen on component mount.
   * It prevents the modal from showing on every visit after the user has seen it once,
   * by checking a flag in localStorage.
   */
  useEffect(() => {
    const hasSeenWhatsNew = localStorage.getItem(WHATS_NEW_LOCAL_STORAGE_KEY);
    if (!hasSeenWhatsNew) {
      setShowWhatsNew(true);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Effect hook to synchronize the active tab and initial tool parameters (ASIN, Keyword)
   * with the URL search parameters when searchParams change.
   * This enables deep linking to specific tabs and pre-filling tool inputs based on the URL.
   */
  useEffect(() => {
    const tabParam = searchParams.get('tab') || 'overview';
    setActiveTab(tabParam);

    // Extract and store initial params if present
    const asinParam = searchParams.get('asin');
    const keywordParam = searchParams.get('keyword');
    setInitialAsin(asinParam);
    setInitialKeyword(keywordParam);

    // Note: Initial params are kept in state to be passed down to dynamic components.
    // Components consuming these props should handle their own internal state updates
    // if they need to react to changes in these initial values.
  }, [searchParams]); // Dependency array includes searchParams to react to URL changes

  /**
   * Memoized callback to handle the closing of the "What's New" modal.
   * It updates the state to hide the modal and sets a flag in localStorage
   * to prevent it from showing again.
   */
  const handleCloseWhatsNew = useCallback(() => {
    setShowWhatsNew(false);
    localStorage.setItem(WHATS_NEW_LOCAL_STORAGE_KEY, 'true');
  }, []);

  /**
   * Memoized callback to trigger a data refresh.
   * It calls the `onRefreshData` function provided by the DataIntegrationTab component.
   */
  const handleRefresh = useCallback(() => {
    if (onRefreshData) {
      onRefreshData();
    } else {
      toast.error('Data refresh function not available.');
    }
  }, [onRefreshData]);

  /**
   * Memoized callback to handle exporting the current dashboard metrics to a CSV file.
   * It transforms the data into a flat format suitable for CSV before exporting.
   * Provides user feedback via toasts.
   */
  const handleExport = useCallback(() => {
    if (metrics?.length === 0) {
      toast.error(
        'No data available to export. Please upload or generate data first.',
      );
      return;
    }

    // Transform metrics to a flat format compatible with CSV export using the helper function.
    const exportableMetrics = (metrics || []).map(transformMetricForExport);

    try {
      exportToCSV(exportableMetrics, 'amazon_seller_tools_data.csv');
      toast.success('Data exported successfully!'); // Add success toast
    } catch (e) {
      console.error('Export failed:', e);
      toast.error('Failed to export data. Please try again.'); // Add error toast
    }
  }, [metrics]); // Dependency array includes metrics from the hook

  /**
   * Memoized callback to handle changing the main dashboard tab and updating the URL search parameter.
   * This ensures that the active tab is reflected in the URL, allowing for direct linking.
   * It also clears tool-specific URL parameters when switching tabs.
   * @param value The value of the tab being activated.
   */
  const handleMainTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('tab', value);
      // When switching tabs, it's generally good practice to clear tool-specific
      // URL parameters (like 'asin' or 'keyword') to avoid unexpected behavior
      // if the new tab doesn't use them.
      currentParams.delete('asin');
      currentParams.delete('keyword');
      router.push(`?${currentParams.toString()}`, { scroll: false });
    },
    [searchParams, router],
  ); // Depend on searchParams and router

  /**
   * Memoized configuration for the tool category tabs.
   * This prevents unnecessary re-creation of these objects on every render,
   * optimizing performance, especially for components that rely on these props.
   * Initial ASIN/Keyword parameters are passed to relevant tools for deep linking.
   */
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
    [initialKeyword, initialAsin],
  );

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

        {/* DashboardHeader now receives props directly from the useAmazonDataIntegration hook */}
        <DashboardHeader
          isLoading={isLoading}
          isParsing={isParsing}
          error={error}
          metricsLength={metrics?.length || 0}
          handleRefresh={handleRefresh}
          handleExport={handleExport}
          metrics={metrics || []}
          onSearch={setSearchTerm}
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
            {/* OverviewTab now receives the entire dataIntegrationData object from the hook */}
            <OverviewTab {...dataIntegrationData} />
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

          {/* Data Integration Tab now uses the hook's return values directly */}
          <TabsContent value="data-integration" className="space-y-4 mt-4">
            {/* Pass the entire dataIntegrationData object to DataIntegrationTab */}
            <DataIntegrationTab {...dataIntegrationData} />
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
