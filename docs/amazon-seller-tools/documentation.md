# Amazon Seller Tools Page Documentation

## 1. Overview

The Amazon Seller Tools page (`src/app/amazon-seller-tools/page.ts`) is a comprehensive dashboard and toolkit designed for Amazon sellers. It allows users to upload their Amazon Business Report data (in CSV format), visualize key performance indicators (KPIs), analyze trends, and access a variety of specialized tools for keyword research, listing optimization, financial calculations, PPC analysis, and competitor research.

The dashboard is structured with a `DashboardHeader` component for refresh, export, and documentation links, and an `OverviewTab` component for data upload, mapping, and visualization.

## 2. Main Features

- **Enhanced Data Visualization:** We've upgraded our charts and added new ones to visualize your sales, advertising performance (clicks, impressions), and engagement (orders, sessions) using the `ReusableChart` component, now with improved stability for consistent rendering within `ResponsiveContainer` and proper event annotations.
- **Improved CSV Data Mapping:** We've made it easier than ever to upload and map your Amazon Business Report data with our new CSV Data Mapper, including data validation.
- **Data Visualization:**
  - KPI Cards: Displaying current metrics and period-over-period comparisons with informative tooltips.
  - Data Table: Displaying the data in a sortable and filterable table using the `TableChart` component, which now supports customizable empty state content, improved column spanning, per-column filtering, custom sort functions, persistent table state, and validation for the `rowIdAccessor` prop.
- **Time Granularity Control:** Data can be aggregated and viewed daily, weekly, monthly, quarterly, or yearly.
- **Time Range Filtering:** Data in charts can be filtered by time range (Last 7 Days, Last 30 Days, Last 90 Days, Year to Date, All Time).
- **Period-over-Period Comparison:** Displays key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS) for the most recent period compared to the previous one. Changes are indicated with icons (up/down arrows) and percentage differences.
- **Specialized Tool Suite:** Organized into tabs for:
  - Keywords
  - Listing Optimization
  - Financials
  - PPC & Ads
  - Competition
- **Data Export:** Processed and aggregated dashboard data can be exported as a CSV.
- **Print and Download PDF:** Easily share your dashboard insights with the new print and download PDF options.
- **Sample Data:** The dashboard now loads sample data from `src/data/sample-data.json` when no CSV file is uploaded. This allows users to explore the dashboard's functionality without uploading their own data.

## 3. How to Use the Overview Dashboard

The "Overview" tab is the primary landing spot for data analysis.

### 3.1. Uploading Data

1.  **Click "Choose Report File (.csv)":** This button is located in the initial view of the "Overview" tab, within the `OverviewTab` component.
2.  **Select your CSV file:** Choose an Amazon Business Report (or a similarly structured CSV) from your computer.
3.  **Column Mapping:**

    - After selecting a file, the "CSV Format Requirements" section will display the required columns for the report.
    - Each required column is listed with a brief description to help you understand the expected data.
    - Ensure that your CSV file contains columns that correspond to the required columns.
    - The column names in your CSV file do not need to match the required column names exactly, but the data in those columns must be consistent with the descriptions provided.
    - Once you have verified that your CSV file contains the required data, you can proceed with uploading the file.

    !Data Mapper UI Placeholder - UPDATE THIS WITH A SCREENSHOT OF THE UPDATED CSVUPLOADER COMPONENT
    _(Ideally, replace this with an actual screenshot of the CsvUploader component in action)_

- Added a transformation configuration modal to allow users to configure transformations for each mapped field.

- **Enhanced CSV Data Processing Feedback:** The system now provides detailed, row-level error information to help users troubleshoot issues with their uploaded CSV files. Valid rows are still processed, with clear indications of any skipped rows or rows with issues. Enhanced loading indicators provide more context during parsing and mapping.

### 3.2. Viewing Data

Once mapping is complete and the data is processed:

- **KPI Cards:**

  - **Summary KPIs:** Cards at the top display overall averages or totals for metrics like "Avg. Conversion Rate," "Total Sales," and "Avg. Clicks."
  - **Period-over-Period Comparison KPIs:** This section shows key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS) for the most recent period compared to the previous one. Changes are indicated with icons (up/down arrows) and percentage differences.

- **Charts:** Visualizing trends for sales, advertising performance (clicks, impressions), and engagement (orders, sessions) using the `ReusableChart` component.

- **Data Table:** Displaying the data in a sortable and filterable table using the `TableChart` component. The table now supports customizable empty state content and improved column spanning.

- **Time Granularity:**

  - Use the "Select Time Granularity" dropdown to change the aggregation period (Daily, Weekly, Monthly, Quarterly, Yearly). Charts and KPI comparisons will update accordingly.

- **Time Range Filtering:**

  - Use the time range selector in the top right corner of each chart to filter the data by time range (Last 7 Days, Last 30 Days, Last 90 Days, Year to Date, All Time).

  !Dashboard View Placeholder
  _(Ideally, replace this with an actual screenshot of the dashboard with data loaded)_

### 3.3. Period-over-Period Comparison

- The dashboard displays period-over-period comparisons for key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS).
- Changes are indicated with icons (up/down arrows) and percentage differences.

### 3.4. Interacting with the Dashboard

- The dashboard now displays sample data when no CSV file is uploaded.

- **Refresh:** Click the "Refresh" button in the `DashboardHeader` to clear current data and start over (e.g., to upload a new file).

- **Export:** Click the "Export" button to download the currently processed and aggregated dashboard metrics as a CSV file.
- **Print:** Click the "Print" button to print the dashboard report.
- **Download PDF:** Click the "Download PDF" button to download the dashboard report as a PDF file.
- **Docs:** Links to external documentation for the Amazon Seller Tools.
- **Error Handling:** If issues occur during file upload, parsing, or mapping, an error message will be displayed. You'll often have an option to "Try uploading again."

## 4. Data Structure (`DashboardMetrics` Interface)

The dashboard processes uploaded data into a standardized `DashboardMetrics` object for each data row/period. Key fields include:

```typescript
export interface DashboardMetrics {
  date: string; // YYYY-MM-DD
  unique_identifier?: string; // ASIN, SKU, etc.

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

  // Keyword Metrics
  targeted_keyword?: string;
  keyword_ad_impressions?: number;
  keyword_ad_clicks?: number;
  keyword_ad_spend?: number;
  keyword_ad_sales_7_day?: number;
  keyword_ad_orders_7_day?: number;

  // Other potential metrics
  profit?: number;
  inventory_level?: number;
  review_rating?: number;
  cac?: number;
  ltv?: number;
  [key: string]: unknown; // Index signature
  asin?: string;
  keyword?: string;
}
```

The `TARGET_METRICS_CONFIG` array defines the labels, requirements, and expected types for the data mapping process. The `GenericCsvDataMapper` component also accepts `toolId` prop, which can be used to identify the tool associated with the data mapper.

## 5. Specialized Tool Tabs

Beyond the overview dashboard, the page provides several tabs, each containing a suite of specialized tools:

### 5.1. Keywords

- Analyzer: For general keyword analysis.
- Deduplicator: To remove duplicate keywords from lists.
- Trend Analyzer: To analyze keyword trends over time.

### 5.2. Listing Optimization

- Description Editor: To help craft and optimize product descriptions.
- Quality Checker: To assess the quality of a product listing.
- Score Calculator: To calculate a score for a product listing based on various factors.

### 5.3. Financials

- FBA Calculator: To estimate FBA fees and profitability.
  - ACoS Calculator: To calculate Advertising Cost of Sales.
  - Profit Margin Calc: To calculate profit margins.
  - Campaign Card: Displays key campaign metrics, including ACoS, CTR, Conversion Rate, and campaign status (Active, Paused, Out of Budget, Ended). Also includes RoAS.
  - Optimal Price Calc: To help determine optimal pricing strategies.

### 5.4. PPC & Ads

- Campaign Auditor: To audit PPC campaign performance.

### 5.5. Competition

- Competitor Analyzer: To analyze competitor products and strategies.
- Sales Estimator: To estimate sales for certain products.

### 5.6. Competitor Analyzer

The Competitor Analyzer is a tool for analyzing competitor products and strategies. It allows users to input competitor product information and analyze their listings, pricing, and other relevant data.

Each of these tools is a self-contained component designed for a specific task.

## 6. ACoS Calculator

---

---

The ACoS Calculator (`src/app/amazon-seller-tools/acos-calculator.tsx`) is a tool for calculating the Advertising Cost of Sales. It allows users to input campaign data either via CSV upload or manual entry, and then calculates and displays the ACoS and RoAS. The calculator also saves the calculation history to IndexedDB and displays it in a table, and visualizes ACoS trends over time using a chart.

### Input Methods

The ACoS Calculator provides two methods for inputting campaign data:

---

- **CSV Upload:** Users can upload a CSV file containing campaign data. The CSV file should have columns for `Campaign`, `AdSpend`, and `Sales`. Optional columns include `Impressions` and `Clicks`.
- **Manual Entry:** Users can manually enter data for a single campaign using the `ManualCalculationForm` component.

### Manual Calculation Form

The `ManualCalculationForm` component (`src/components/amazon-seller-tools/ManualCalculationForm.tsx`) allows users to manually enter data for a single campaign. The form includes the following fields:

- **Campaign Name:** The name of the campaign.
- **Ad Spend ($):** The amount spent on advertising.
- **Sales ($):** The revenue generated from advertising.
- **Impressions:** The number of impressions.
- **Clicks:** The number of clicks.
- **Clear History:** A button to clear the calculation history.

### 6.3. ACoS Rating Guide

The `AcosRatingGuide` component (`src/components/amazon-seller-tools/AcosRatingGuide.tsx`) displays a guide for interpreting ACoS values. The guide includes the following ratings:

- **Excellent:** ACoS is less than 15%.
- **Good:** ACoS is between 15% and 25%.
- **Okay:** ACoS is between 25% and 35%.
- **Poor:** ACoS is greater than 35%.

### 6.4. Calculation History Table

The `CalculationHistoryTable` component (`src/components/amazon-seller-tools/CalculationHistoryTable.tsx`) displays a table of the calculation history, including the following columns:

- Campaign
- Date
- Ad Spend
- Sales
- ACoS
- RoAS

### 6.5. ACoS Trend Chart

The `AcosTrendChart` component (`src/components/amazon-seller-tools/AcosTrendChart.tsx`) visualizes the ACoS over time using a line chart. The chart displays the ACoS values for each saved calculation, allowing users to track ACoS trends.

## 7. Technical Notes

- Frontend: Built with TypeScript and React (Next.js).
- UI Components: Uses Shadcn UI components (Button, Card, Tabs, Select, Alert).
- Charting: Recharts library for data visualization.
- CSV Parsing: PapaParse library for handling CSV file uploads, primarily within the `OverviewTab` component.
- Date Manipulation: date-fns library for handling dates and time granularities.
- State Management: React's useState and useRef hooks.
- IndexedDB: IndexedDB for local data storage (for calculation history).
- Supabase: Supabase for application configurations.
- Logging: Added logging to the `handleDownloadSampleCsv` function in `src/app/amazon-seller-tools/page.tsx` and `src/components/shared/GenericCsvDataMapper.tsx`.

---

- New Components: `AcosRatingGuide`, `CalculationHistoryTable`, `ManualCalculationForm`, `AcosTrendChart`, and `KeywordVsAdSalesDonutChart`.
- Utility Files: `src/lib/amazon-tools/acos-calculator-utils.ts` and `src/lib/amazon-tools/metrics.ts`.
- Modified Files: `src/types/csv-transformer-config.ts`, `src/types/data-mapping.ts`, `src/lib/utils/amazon/data-transformation.ts`, and `src/config/amazon-tools-config.ts`.

## 7. Data Structure (`CampaignData` Interface)

The dashboard processes uploaded data and manual input into a standardized `CampaignData` object. Key fields include:

```typescript
export interface CampaignData {
  campaign: string;
  adSpend: number;
  sales: number;
  acos: number;
  roas: number;
  date: string;
}
```

## 8. ReusableChart Component

The `ReusableChart` component (`src/components/amazon-seller-tools/charts/ReusableChart.tsx`) is a versatile component for rendering various types of charts, including line and bar charts. It leverages the Recharts library for data visualization. Its rendering logic has been updated for improved stability and consistent hook calls.

- **Props:**

  - `sortedMetrics`: An array of `DashboardMetrics` objects containing the data to be displayed in the chart.
  - `granularity`: A string that specifies the granularity of the data (e.g., 'daily', 'weekly', 'monthly', 'quarterly', 'yearly').
  - `chartType`: A string that specifies the type of chart to render ('line' or 'bar').
  - `xAxisDataKey`: A string that specifies the data key to use for the x-axis (e.g., 'date').
  - `yAxisDataKeys`: An array of strings that specifies the data keys to use for the y-axis (e.g., ['total_sales'], ['ad_clicks', 'ad_impressions']).
  - `colors`: An array of strings that specifies the colors to use for the chart lines/bars (e.g., ['#8884d8'], ['#8884d8', '#82ca9d']).
  - `labels`: An array of strings that specifies the labels to use for the chart lines/bars (e.g., ['Sales'], ['Clicks', 'Impressions']).
  - `title`: A string that specifies the title of the chart (e.g., 'Total Sales Trends').
  - `yAxisFormatter`: An optional function that formats the y-axis values (e.g., (value) => `$${value.toLocaleString()}`).
  - `tooltipFormatter`: An optional function that formats the tooltip values (e.g., (value, name) => [`$${value.toLocaleString()}`, name]).
  - `timeRange`: A string that specifies the time range to filter the data by (e.g., '7', '30', '90', 'ytd', 'all').
  - `setTimeRange`: A function to set the time range.

## 9. DashboardHeader Component

The `DashboardHeader` component (`src/components/amazon-seller-tools/DashboardHeader.tsx`) is a reusable component that displays the dashboard header, including the refresh button, export button, and documentation link.

- **Props:**

  - `isLoading`: A boolean indicating whether the dashboard is loading.
  - `isParsing`: A boolean indicating whether the dashboard is parsing data.
  - `error`: A string or null indicating whether there is an error.
  - `metricsLength`: A number indicating the number of metrics loaded.
  - `handleRefresh`: A function to be called when the refresh button is clicked.
  - `handleExportData`: A function to be called when the export button is clicked.
  - `handlePrint`: A function to be called when the print button is clicked.

## 10. OverviewTab Component

The `OverviewTab` component (`src/components/amazon-seller-tools/OverviewTab.tsx`) is a reusable component that displays the overview tab, including the data upload, mapping, and visualization. It utilizes `isUploading`, `isMapping`, and `isProcessing` props to indicate the state of these processes, offering granular control and feedback. Its internal structure has been refactored to ensure consistent React Hook calls across different render paths, resolving "Rendered more hooks" errors.

- **Props:**

  - `metrics`: An array of `DashboardMetrics` objects containing the data to be displayed.
  - `setMetrics`: A function to set the metrics.
  - `isLoading`: A boolean indicating whether the dashboard is loading.
  - `setIsLoading`: A function to set the loading state.
  - `isParsing`: A boolean indicating whether the dashboard is parsing data.
  - `setIsParsing`: A function to set the parsing state.
  - `error`: A string or null indicating whether there is an error.
  - `setError`: A function to set the error state.
  - `TARGET_METRICS_CONFIG`: An array of `TargetMetricConfig` objects containing the target metrics configuration.
  - `isUploading`: A boolean indicating if parent considers it uploading
  - `setIsUploading`: Setter from parent
  - `isMapping`: Prop indicating if parent considers it mapping
  - `setIsMapping`: Setter from parent
  - `isProcessing`: Prop indicating if parent considers it processing
  - `setIsProcessing`: Setter from parent

## 11. Button Component

The `Button` component (`src/components/ui/Button.tsx`) is a reusable UI element for creating buttons with a consistent style. It uses Tailwind CSS for styling.

- **Props:**

  - `children`: The content of the button (e.g., text).
  - `onClick`: A function to be called when the button is clicked.
  - `className`: Optional CSS class names for additional styling. Includes focus styles.

- **Usage:**

```typescript
import Button from './Button';

function MyComponent() {
  const handleClick = () => {
    alert('Button clicked!');
  };

  return (
    <Button onClick={handleClick} className="my-custom-class">
      Click Me
    </Button>
  );
}
```

---

## 12. IndexedDB Integration

IndexedDB is used for local, browser-based data storage. This allows the tools to store user-specific data, such as saved calculations and preferences, improving performance and enabling offline functionality. The ACoS calculator now stores calculation history in IndexedDB. See [IndexedDB Integration Documentation](data-storage/indexeddb_integration.md) for more details. The `indexeddb-service.ts` file provides an interface for interacting with the IndexedDB database.

## 13. Supabase Integration

Supabase is used for storing application configurations. Authentication implementation (user accounts) will be deferred to a later phase to prioritize core tool functionality. Supabase will initially be leveraged for global configurations and tool-specific settings. The `supabase-service.ts` file handles interactions with the Supabase backend.

## 14. Calculations Utility

The `calculations.ts` file (`src/lib/utils/amazon/calculations.ts`) contains utility functions for performing calculations related to Amazon seller tools. This promotes code reusability and maintainability.

- **Functions:**
  - `calculateAcos(adSpend: number, adSales: number): number`: Calculates the Advertising Cost of Sales (ACoS).
  - `calculateProfitMargin(revenue: number, costOfGoodsSold: number, otherCosts: number): number`: Calculates the profit margin.

## 15. Key Areas for Improvement

The following improvements have been implemented:

- Updated tooltips for KPI cards in the `OverviewDataView` component to provide clearer context and definitions for the metrics.
- Enhanced the `tooltipFormatter` prop in the `ReusableChart` component to display more detailed information in chart tooltips, including exact values, date ranges, and period-over-period comparisons. The `enhancedTooltipFormatter` function now calculates and displays percentage changes compared to the previous period.
- Improved the visual indicators for sorting in the `MetricsDataTable` component, making it clearer which columns are sorted and in what direction. More prominent arrow icons now indicate the sort direction.
- Implemented more detailed progress messages and a progress bar in the `GenericCsvDataMapper` and `OverviewTab` components to provide more granular feedback during CSV file parsing and data processing.
- Added a loading indicator to the `OverviewTab` component to show the status of the upload, parsing, and processing stages.
- Implemented basic mapping persistence using IndexedDB to save the user's last-used column mapping preferences. On subsequent uploads, the mapping suggestions are pre-populated based on the saved configuration.
- Added tooltips and help text to specialized tools to provide in-context guidance for each tool's purpose, key inputs, and expected outputs.

---

**_This section outlines the key areas for improvement for the Amazon Seller Tools Dashboard._**
