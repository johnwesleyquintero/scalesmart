# Amazon Seller Tools Page Documentation

## 1. Overview

The Amazon Seller Tools page (`src/app/amazon-seller-tools/page.tsx`) is a comprehensive dashboard and toolkit designed for Amazon sellers. It allows users to upload their Amazon Business Report data (in CSV format), visualize key performance indicators (KPIs), analyze trends, and access a variety of specialized tools for keyword research, listing optimization, financial calculations, PPC analysis, and competitor research.

The dashboard is structured with a `DashboardHeader` component for refresh, export, and documentation links, and an `OverviewTab` component for data upload, mapping, and visualization.

## 2. Key Features

- **CSV Data Upload and Mapping:** Users can upload CSV files (e.g., Amazon Business Reports, Advertising Reports). The `OverviewDataMapper` component (within `OverviewTab`) allows users to map CSV columns to predefined `DashboardMetrics` fields. Mapping preferences can be saved per tool.
- **Dashboard Visualization:**
  - KPI Cards: Displaying current metrics and period-over-period comparisons with informative tooltips.
  - Data Table: Displaying the data in a sortable and filterable table using the `TableChart` component, which now supports customizable empty state content, improved column spanning, per-column filtering, custom sort functions, persistent table state, and validation for the `rowIdAccessor` prop.
- **Time Granularity Control:** Data can be aggregated and viewed daily, weekly, monthly, quarterly, or yearly.
- **Time Range Filtering:** Data in the Overview tab can be filtered by a global time range selector, offering options like "Last 7 Days", "Last 30 Days", "Month to Date", "Year to Date", "All Time", and "Custom Range".
- **Period-over-Period Comparison:** Displays key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS) for the most recent period compared to the previous one. Changes are indicated with icons (up/down arrows) and percentage differences.
- **Specialized Tool Suite:** Organized into tabs for:
  - Keywords
  - Listing Optimization
  - Financials
  - PPC & Ads
  - Competition
- **Data Export:** Processed and aggregated dashboard data can be exported as a CSV.
- **Print and Download PDF:** Easily share your dashboard insights with the new print and download PDF options.
- **Sample Data:** The dashboard now loads sample data (e.g., `SAMPLE_CHART_DATA` from `'data/amazon-tools-sample-data/amazon-dashboard-sample-data`) when no CSV file is uploaded. This allows users to explore the dashboard's functionality without uploading their own data.
- **Keyword Performance Overview Table:** A new toggleable table in the `OverviewTab` for a dedicated view of keyword performance metrics, offering more granular insights.

## 3. How to Use the Overview Dashboard

1.  **Navigate to the Page:** Access the Amazon Seller Tools via the main navigation.
2.  **Upload CSV Data:**
    - Click the "Upload CSV" button in the `OverviewTab`.
    - Select your Amazon Business Report CSV file.
    - The `OverviewDataMapper` will appear.
3.  **Map CSV Columns:**
    - For each "Dashboard Field" (target metric), select the corresponding column from your CSV file using the dropdown.
    - Required fields are marked with an asterisk (\*).
    - Hints are provided for common Amazon report column names.
    - Once all required fields are mapped, click "Apply Mapping".
    - Your mapping preferences will be saved locally for this tool for future uploads.
4.  **View Dashboard:**
    - The dashboard will display your data in various charts and tables.
    - KPI cards show key metrics and period-over-period changes.
    - Charts visualize trends for sales, clicks, impressions, orders, sessions, ad spend, and ad sales.
    - **Data Table:** Displaying the data in a sortable and filterable table using the `TableChart` component. The table now supports customizable empty state content, improved column spanning, per-column filtering, custom sort functions, and persistent table state.
    - **Keyword Performance Overview Table:** Accessible via a toggle button, this table provides granular insights into keyword-specific metrics.
    - **Time Granularity:** Use the "Select Time Granularity" dropdown in the `OverviewTab` to change the aggregation period (Daily, Weekly, Monthly, Quarterly, Yearly). Charts and KPI comparisons will update accordingly.
    - **Time Range Filtering:** Use the global time range selector in the `OverviewTab` to filter the data. Available options include "Last 7 Days", "Last 30 Days", "Month to Date", "Year to Date", "All Time", and "Custom Range".

!Dashboard View Placeholder
_(Ideally, replace this with an actual screenshot of the dashboard with data loaded)_

5.  **Interact with Data:**
    - **Sort Tables:** Click on column headers in the `TableChart` to sort data.
    - **Filter Tables:** Use filter inputs (if enabled) for specific columns in `TableChart`.
    - **Export Data:** Click the "Export Data" button in the `DashboardHeader` to download the processed data as a CSV.
    - **Refresh/Reset:** Click the "Refresh" button to clear the current data and start over.

## 4. Data Structure (`DashboardMetrics` Interface)

The dashboard processes uploaded data into a standardized `DashboardMetrics` object for each data row/period. This interface is defined in `src/lib/amazon-tools/types.ts`. Key fields include:

```typescript
export interface DashboardMetrics {
  date: string; // YYYY-MM-DD
  unique_identifier: string; // ASIN, SKU, etc.

  // Business Report / Total Metrics
  total_sales?: number;
  total_orders?: number;
  total_sessions?: number;
  total_page_views?: number;
  total_conversion_rate?: number;

  // Advertising Metrics
  ad_impressions?: number;
  ad_clicks?: number;
  ad_spend?: number;
  ad_sales?: number;
  ad_orders?: number;

  // Calculated Advertising Metrics
  acos?: number;
  roas?: number;
  cpc?: number;
  ctr?: number;
  ad_conversion_rate?: number;

  // Other potential metrics
  profit?: number;
  inventory_level?: number;
  review_rating?: number;
  cac?: number;
  ltv?: number;
  asin?: string;
  keyword?: string;

  // Keyword Metrics (specific to keyword performance)
  targeted_keyword?: string; // From 'Targeted Keyword'
  keyword_ad_impressions?: number; // From 'Keyword Ad Impressions'
  keyword_ad_clicks?: number; // From 'Keyword Ad Clicks'
  keyword_ad_spend?: number; // From 'Keyword Ad Spend'
  keyword_ad_sales_7_day?: number; // From 'Keyword Ad Sales (7-day)' (keyword specific)
  keyword_ad_orders_7_day?: number; // From 'Keyword Ad Orders (7-day)' (keyword specific)

  [key: string]: unknown; // Allow for other properties

  // Validation and Outlier Flags
  date_validation_warning?: boolean;
  unique_identifier_validation_warning?: boolean;
  total_sales_outlier_flag?: boolean;
  total_orders_outlier_flag?: boolean;
  total_sessions_outlier_flag?: boolean;
  total_page_views_outlier_flag?: boolean;
  total_conversion_rate_outlier_flag?: boolean;
  ad_impressions_outlier_flag?: boolean;
  ad_clicks_outlier_flag?: boolean;
  ad_spend_outlier_flag?: boolean;
  ad_sales_outlier_flag?: boolean;
  ad_orders_outlier_flag?: boolean;
  acos_outlier_flag?: boolean;
  roas_outlier_flag?: boolean;
  cpc_outlier_flag?: boolean;
  ctr_outlier_flag?: boolean;
  ad_conversion_rate_outlier_flag?: boolean;
  profit_outlier_flag?: boolean;
  inventory_level_outlier_flag?: boolean;
  review_rating_outlier_flag?: boolean;
  cac_outlier_flag?: boolean;
  ltv_outlier_flag?: boolean;
  targeted_keyword_validation_warning?: boolean;
  keyword_ad_impressions_outlier_flag?: boolean;
  keyword_ad_clicks_outlier_flag?: boolean;
  keyword_ad_spend_outlier_flag?: boolean;
  keyword_ad_sales_7_day_outlier_flag?: boolean;
  keyword_ad_orders_7_day_outlier_flag?: boolean;
  asin_validation_warning?: boolean;
  keyword_validation_warning?: boolean;
}
```

The TARGET_METRICS_CONFIG array (from src/config/amazon-tools-config.ts) defines the labels, requirements, and expected types for the data mapping process. The OverviewTab uses the OverviewDataMapper component for this purpose.

## 5. Specialized Tool Tabs

Beyond the Overview dashboard, the Amazon Seller Tools page provides access to several specialized tools organized into tabs:

- **Keywords:** Tools for keyword research, analysis, and deduplication.
  - `KeywordAnalyzer`: Analyzes keyword performance.
  - `KeywordDeduplicator`: Removes duplicate keywords from a list.
  - `KeywordTrendAnalyzer`: Visualizes keyword trends over time.
- **Listing Optimization:** Tools to improve product listings.
  - `DescriptionEditor`: A rich text editor for crafting product descriptions.
  - `ListingQualityChecker`: Assesses the quality of a product listing.
  - `ProductScoreCalculator`: Calculates a score based on various product attributes.
- **Financials:** Calculators for financial metrics.
  - `FbaCalculator`: Estimates FBA fees.
  - `AcosCalculator`: Calculates Advertising Cost of Sales (ACoS).
  - `ProfitMarginCalculator`: Calculates profit margins.
  - `OptimalPriceCalculator`: Helps determine optimal product pricing.
- **PPC & Ads:** Tools for managing and auditing PPC campaigns.
  - `PpcCampaignAuditor`: Audits PPC campaign performance.
- **Competition:** Tools for analyzing competitors.
  - `CompetitorAnalyzer`: Analyzes competitor products and performance.
  - `SalesEstimator`: Estimates sales potential.
    Each tool tab contains relevant components and functionalities specific to its purpose.

## 6. ACoS Calculator Details

The ACoS Calculator (src/components/amazon-seller-tools/acos-calculator.tsx) is a tool for calculating the Advertising Cost of Sales. It allows users to input campaign data either via CSV upload (handled by OverviewTab's data loader if adapted) or manual entry, and then calculates and displays the ACoS and RoAS. The calculator also saves the calculation history to IndexedDB and displays it in a table, and visualizes ACoS trends over time using a chart.

### 6.1. Input Methods

The ACoS Calculator primarily uses manual entry. CSV upload for direct ACoS calculation would typically be part of a broader data import strategy via the OverviewTab.

- **Manual Entry:** Users can manually enter data for a single campaign using the `ManualCalculationForm` component.

### 6.2. Manual Calculation Form

The `ManualCalculationForm` component (src/components/amazon-seller-tools/ManualCalculationForm.tsx) allows users to manually enter data for a single campaign. The form includes the following fields:

- Campaign Name: The name of the campaign.
- Ad Spend ($): The amount spent on advertising.
- Sales ($): The revenue generated from advertising.
- Impressions: The number of impressions (optional).
- Clicks: The number of clicks (optional).
- Clear History: A button to clear the calculation history.

### 6.3. ACoS Rating Guide

The `AcosRatingGuide` component (src/components/amazon-seller-tools/AcosRatingGuide.tsx) displays a guide for interpreting ACoS values. The guide includes the following ratings:

- Excellent: ACoS is less than 15%.
- Good: ACoS is between 15% and 25%.
- Okay: ACoS is between 25% and 35%.
- Poor: ACoS is greater than 35%.

### 6.4. Calculation History Table

The `CalculationHistoryTable` component (src/components/amazon-seller-tools/CalculationHistoryTable.tsx) displays a table of the calculation history, including the following columns:

- Campaign
- Date
- Ad Spend
- Sales
- ACoS
- RoAS

### 6.5. ACoS Trend Chart

The `AcosTrendChart` component (src/components/amazon-seller-tools/charts/AcosTrendChart.tsx) visualizes the ACoS over time using a line chart. The chart displays the ACoS values for each saved calculation, allowing users to track ACoS trends.

## 7. Technical Notes

- Frontend: Built with TypeScript and React (Next.js).
- UI Components: Uses Shadcn UI components (Button, Card, Tabs, Select, Alert, etc.).
- Charting: Recharts library for data visualization.
- CSV Parsing: PapaParse library for handling CSV file uploads, primarily within the OverviewTab component.
- Date Manipulation: date-fns library for handling dates and time granularities.
- State Management: React's useState, useCallback, useMemo, useRef, useEffect hooks.
- IndexedDB: IndexedDB for local data storage (e.g., ACoS calculation history, mapping preferences, view preferences). The `indexeddb-service.ts` provides an interface.
- Supabase: Supabase for application configurations.
- Logging: Added logging to the `handleDownloadSampleCsv` function in `src/app/amazon-seller-tools/page.tsx` and `src/components/shared/GenericCsvDataMapper.tsx`.

## 8. Data Structure (`CampaignData` Interface)

The dashboard processes uploaded data and manual input into a standardized `CampaignData` object. Key fields include:

```typescript
export interface CampaignData {
  campaign: string;
  adSpend: number;
  sales: number;
  impressions?: number;
  clicks?: number;
  acos?: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  revenuePerClickRate?: number;
  date?: string;
}
```

## 9. ReusableChart Component

The `ReusableChart` component (src/components/amazon-seller-tools/charts/ReusableChart.tsx) is a versatile component for rendering various types of charts, including line and bar charts. It leverages the Recharts library for data visualization.

Props:

- `sortedMetrics`: An array of `DashboardMetrics` objects.
- `granularity`: `'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'`.
- `chartType`: `'line' | 'bar'`.
- `xAxisDataKey`: A key from `DashboardMetrics` for the x-axis.
- `yAxisDataKeys`: An array of keys from `DashboardMetrics` for the y-axis.
- `colors`: Optional array of color strings.
- `labels`: Array of strings for legend labels.
- `title`: Chart title.
- `yAxisFormatter`: Optional function to format y-axis ticks.
- `tooltipFormatter`: An optional function that formats the tooltip values (e.g., `(value, name) => [`$${value.toLocaleString()}`, name]`).
- `timeRange`: A string that specifies the time range to filter the data by (e.g., `'7'`, `'30'`, `'90'`, `'ytd'`, `'all'`).
- `setTimeRange`: A function to set the time range.
- `events`: An optional array of event objects to annotate the chart.

## 10. DashboardHeader Component

The `DashboardHeader` component (src/components/amazon-seller-tools/DashboardHeader.tsx) displays the header for the Amazon Seller Tools dashboard.

Props:

- `isLoading`: Boolean indicating if data is loading.
- `isParsing`: Boolean indicating if data is being parsed.
- `error`: A string or null indicating whether there is an error.
- `metricsLength`: A number indicating the number of metrics loaded.
- `handleRefresh`: A function to be called when the refresh button is clicked.
- `handleExport`: A function to be called when the export button is clicked (currently shows an error if no data).
- `metrics`: An array of `DashboardMetrics` objects.
- `onSearch`: A function to handle search term changes.
  Note: Print functionality is typically handled by browser features or dedicated libraries, not directly via a `handlePrint` prop on `DashboardHeader`.

## 11. OverviewTab Component

The `OverviewTab` component (src/components/amazon-seller-tools/OverviewTab.tsx) is the main content area for the dashboard overview. It handles CSV upload, data mapping, and displays various charts and data summaries.

Props:

- `metrics`: Array of `DashboardMetrics`.
- `setMetrics`: Function to update metrics.
- `isLoading`, `setIsLoading`: Loading state and setter.
- `isParsing`, `setIsParsing`: Parsing state and setter.
- `isUploading`, `setIsUploading`: Uploading state and setter.
- `isMapping`, `setIsMapping`: Mapping state and setter.
- `isProcessing`, `setIsProcessing`: Processing state and setter.
- `error`: Error string or null.
- `setError`: Function to set error state.
- `TARGET_METRICS_CONFIG`: Configuration for target metrics.
- `searchTerm`: A string representing the current search term for filtering data.

## 12. Button Component

The `Button` component (src/components/ui/button.tsx - part of Shadcn UI) is a reusable UI element for creating buttons with consistent styling.

Props: (Refer to Shadcn UI documentation for Button props like `variant`, `size`, etc.)

- `children`: The content of the button.
- `onClick`: Function called on button click.
- `className`: Optional CSS classes.

## 13. IndexedDB Integration

IndexedDB is used for local, browser-based data storage. This allows tools to store user-specific data like calculation history (`acos-calculator-history`), table state (`amazon-seller-tools-table-chart-state`), selected metrics (`overview-tab-selected-metrics`), and dashboard view preferences (`dashboard_view_preferences`). The `indexeddb-service.ts` file provides an interface for these operations.

## 14. Supabase Integration

Supabase is used for storing application configurations. Authentication and user-specific cloud storage may be integrated in later phases.

## 15. Utility Functions

- `src/lib/amazon-tools/acos-calculator-utils.ts`: Contains utilities specific to the ACoS calculator.
- `src/lib/utils/amazon/data-aggregation.ts`: Functions for aggregating `DashboardMetrics` by different time granularities.
- `src/lib/utils/amazon/data-transformation.ts`: Handles the transformation of raw CSV rows into `DashboardMetrics` objects, including parsing, validation, and error/outlier flagging.
- `src/lib/utils/formatting.ts`: Provides functions for formatting currency, percentages, and dates for display.

## 16. Key Areas for Improvement (Status Update)

This section outlines potential areas for further improvement based on recent code reviews.

- **Date and Numeric Parsing Robustness:** Enhance date and numeric parsing logic in `data-transformation.ts` and `TableChart.tsx` using a dedicated library (e.g., `date-fns`) for consistency and better handling of edge cases.
- **Filter Operators in TableChart.tsx:** The `between` filter operator for number and date range filter types has been implemented.
- **rowIdAccessor Null Checks:** Add explicit null/undefined checks for the `rowIdAccessor` prop in `TableChart.tsx` where it is used in handlers and memoized values to prevent potential runtime errors if the prop is missing when required. (A console warning for duplicates/missing `rowIdAccessor` is present).
- **Refine CSV Parsing Error Handling:** Investigate PapaParse's error handling during the `step` function in `OverviewTab.tsx` to ensure all parsing errors are captured and reported correctly.
- **Clarify "Refresh" Behavior:** Modify the `handleRefresh` function in `src/app/amazon-seller-tools/page.tsx` to actually trigger data reload/re-processing in `OverviewTab`, or rename it to better reflect its current behavior (clearing state). (Current behavior in `page.tsx` resets most states, which aligns with "start over").
- **Persist selectedMetrics:** Logic in `OverviewTab.tsx` saves the `selectedMetrics` state to IndexedDB. (Completed)
- **Centralize Type Definitions and Constants:** The `DashboardMetrics` interface is now in `src/lib/amazon-tools/types.ts`, and common IndexedDB keys are in `src/lib/constants.ts`. (Largely Completed)
- **Improve Code Structure:** Extract the nested `OverviewTabContentDisplay` component from `OverviewTab.tsx` into its own file and consider breaking down other long functions (`handleFileChange`, `processCsvData`, `handleMappingComplete`) into smaller helpers.
- **Consolidate Loading States:** Explore simplifying the multiple boolean loading/processing states in `OverviewTab.tsx` into a single status state variable.
- **Optimize Performance for Large Datasets:** Consider incremental CSV processing within the PapaParse `step` function and potentially offloading heavy data processing (sorting, filtering, aggregation) to a Web Worker if performance becomes an issue with very large files.
- **Redundant UI in OverviewDataView.tsx:** The time range selector UI was specific to `OverviewTab.tsx`, and `OverviewDataView.tsx` (now an internal part of `OverviewTab`) does not have a duplicate. (Addressed)
- **KPI Calculation Logic in OverviewDataView.tsx:** KPI calculations are primarily handled within `OverviewTab.tsx` before data is passed to display components. (Largely Addressed)
- **Formatting Helpers:** Formatting functions (`formatCurrencyValue`, `formatPercentageValue`, etc.) have been moved to `src/lib/utils/formatting.ts`. (Completed)
- **Maintain Tooltip Content:** Ensure tooltip descriptions remain accurate as features evolve.
