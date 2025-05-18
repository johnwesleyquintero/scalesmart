# Amazon Seller Tools Page Documentation

## 1. Overview

The Amazon Seller Tools page (`c:\Users\johnw\portfolio\src\app\amazon-seller-tools\page.tsx`) is a comprehensive dashboard and toolkit designed for Amazon sellers. It allows users to upload their Amazon Business Report data (in CSV format), visualize key performance indicators (KPIs), analyze trends, and access a variety of specialized tools for keyword research, listing optimization, financial calculations, PPC analysis, and competitor research.

## 2. Main Features

- **Unified Dashboard:** Provides an overview of key business metrics once data is uploaded.
- **CSV Data Upload & Mapping:** Users can upload their Amazon Business Report CSVs. A dynamic mapping interface using the `GenericCsvDataMapper` component helps match CSV columns to the required data fields.
- **Data Visualization:**
  - KPI Cards: Displaying current metrics and period-over-period comparisons.
  - Charts: Visualizing trends for sales, advertising performance (clicks, impressions), and engagement (orders, sessions).
- **Time Granularity Control:** Data can be aggregated and viewed daily, weekly, monthly, quarterly, or yearly.
- **Period-over-Period Comparison:** Displays key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS) for the most recent period compared to the previous one.
- **Specialized Tool Suite:** Organized into tabs for:
  - Keywords
  - Listing Optimization
  - Financials
  - PPC & Ads
  - Competition
- **Data Export:** Processed and aggregated dashboard data can be exported as a CSV.
- **Sample Data:** A sample CSV file is available for download to demonstrate the expected format and functionality.

## 3. How to Use the Overview Dashboard

The "Overview" tab is the primary landing spot for data analysis.

### 3.1. Uploading Data

1.  **Click "Choose Report File (.csv)":** This button is located in the initial view of the "Overview" tab.
2.  **Select your CSV file:** Choose an Amazon Business Report (or a similarly structured CSV) from your computer.
3.  **Column Mapping:**

    - After selecting a file, a "Map Report Columns" interface powered by the `GenericCsvDataMapper` component will appear.
    - This interface displays headers from your CSV file and target fields required by the dashboard (e.g., 'Date', 'Total Sales', 'Ad Spend').
    - For each target field, select the corresponding column from your CSV using the dropdown menus.
    - Hints are provided for each target field to guide you.
    - A sample data row from your CSV is shown to help with mapping.
    - Required fields (like 'Date') must be mapped.
    - Click "Confirm Mapping" to process the file or "Cancel" to abort.

    !Data Mapper UI Placeholder
    _(Ideally, replace this with an actual screenshot of the GenericCsvDataMapper component in action)_

### 3.2. Viewing Data

Once mapping is complete and the data is processed:

- **KPI Cards:**

  - **Summary KPIs:** Cards at the top display overall averages or totals for metrics like "Avg. Conversion Rate," "Total Sales," and "Avg. Clicks."
  - **Period-over-Period Comparison KPIs:** This section shows key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS) for the most recent period compared to the previous one. Changes are indicated with icons (up/down arrows) and percentage differences.

- **Charts:**

  - **Total Sales Trends:** A line chart showing total sales over time.
  - **Ad Clicks & Ad Impressions:** A bar chart displaying advertising clicks and impressions.
  - **Total Orders & Total Sessions:** A bar chart showing total orders and sessions.

- **Time Granularity:**

  - Use the "Select Time Granularity" dropdown to change the aggregation period (Daily, Weekly, Monthly, Quarterly, Yearly). Charts and KPI comparisons will update accordingly.

  !Dashboard View Placeholder
  _(Ideally, replace this with an actual screenshot of the dashboard with data loaded)_

### 3.3. Period-over-Period Comparison

- The dashboard displays period-over-period comparisons for key metrics (Total Sales, Total Orders, Conversion Rate, ACoS, RoAS).
- Changes are indicated with icons (up/down arrows) and percentage differences.

### 3.4. Interacting with the Dashboard

- **Refresh:** Click the "Refresh" button in the header to clear current data and start over (e.g., to upload a new file).
- **Export:** Click the "Export" button to download the currently processed and aggregated dashboard metrics as a CSV file.
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

  // Other potential metrics
  profit?: number;
  inventory_level?: number;
  review_rating?: number;
  cac?: number;
  ltv?: number;
  [key: string]: unknown; // Index signature
}
```

The TARGET_METRICS_CONFIG array defines the labels, requirements, and expected types for the data mapping process.

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
- Optimal Price Calc: To help determine optimal pricing strategies.

### 5.4. PPC & Ads

- Campaign Auditor: To audit PPC campaign performance.

### 5.5. Competition

- Competitor Analyzer: To analyze competitor products and strategies.
- Sales Estimator: To estimate sales for certain products.
  Each of these tools is a self-contained component designed for a specific task.

## 6. Technical Notes

- Frontend: Built with TypeScript and React (Next.js).
- UI Components: Uses Shadcn UI components (Button, Card, Tabs, Select, Alert).
- Charting: Recharts library for data visualization.
- CSV Parsing: PapaParse library for handling CSV file uploads.
- Date Manipulation: date-fns library for handling dates and time granularities.
- State Management: React's useState and useRef hooks.

## 7. Sample Data

A sample CSV file (sample_amazon_data.csv) can be downloaded via the "Download Sample CSV" button on the initial "Overview" tab. This file demonstrates the expected data structure and can be used to test the dashboard's functionality without your own data. The sample data includes columns like:

- Date
- ASIN
- Ordered product sales
- Total order items
- Sessions
- Page Views
- Impressions (Ad)
- Clicks (Ad)
- Spend (Ad)
- Sales (Ad)
- Orders (Ad)
  This helps users understand what kind of data the tool expects and how it maps to the dashboard metrics.

This documentation should give a good overview of the Amazon Seller Tools page. You can expand on specific tools or sections as needed!
