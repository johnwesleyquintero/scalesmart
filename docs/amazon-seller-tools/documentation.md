# Amazon Seller Tools Dashboard Documentation (`src/app/amazon-seller-tools/page.tsx`)

## Overview

The Amazon Seller Tools Dashboard (`src/app/amazon-seller-tools/page.tsx`) provides a suite of tools designed to help Amazon sellers analyze data, optimize listings, and improve performance. The dashboard is organized into tabs, each containing a set of related tools.

## Functionality

- **Overview:** Displays key metrics and charts based on uploaded Amazon Business Report data.
- **Keywords:** Provides tools for keyword analysis, including keyword analysis, deduplication, and trend analysis.
- **Listing Optimization:** Offers tools for optimizing product listings, including a description editor, listing quality checker, and product score calculator.
- **Financials:** Includes tools for financial calculations, such as FBA calculator, ACoS calculator, profit margin calculator, and optimal price calculator.
- **PPC & Ads:** Provides tools for managing PPC campaigns, including a campaign auditor.
- **Competition:** Offers tools for analyzing competitors, including a competitor analyzer and sales estimator.

## Potential Enhancements

- **Data Integration (API):** Integrate the dashboard with the Amazon Marketplace Web Service (MWS) API or the Selling Partner API (SP-API) to allow for real-time data retrieval. This would involve:

  - Adding API authentication and data retrieval logic.
  - Modifying the data mapping component to handle API data.
  - Updating the dashboard components to display real-time data.
  - **Anticipated Benefits:**
    - Eliminate the need for manual data uploads.
    - Provide real-time data updates.
    - Improve the accuracy and reliability of the data.
    - Enhance the user experience.

- **Enhanced Data Transformation:** Enhance the `transformCsvRow` function to handle more diverse CSV formats and data types. This would involve:

  - Adding more robust error handling and validation.
  - Supporting different date formats.
  - Allowing users to define custom data transformations.
  - **Anticipated Benefits:**
    - Improve the flexibility and usability of the dashboard.
    - Allow the dashboard to handle more diverse CSV formats.
    - Reduce the need for users to manually edit their CSV files.

- **More Comprehensive Metrics:** Expand the `DashboardMetrics` interface to include more metrics, such as:
  - Advertising Cost of Sales (ACoS)
  - Return on Ad Spend (ROAS)
  - Customer Acquisition Cost (CAC)
  - Lifetime Value (LTV)
  - **Anticipated Benefits:**
    - Provide users with a more complete picture of their business performance.
    - Allow users to make more informed decisions.

## Technical Details

- The dashboard uses the `recharts` library for creating charts.
- The `papaparse` library is used to parse CSV files.
- The dashboard uses tabs to organize the different tools.
- The dashboard uses dynamic imports to load components, improving initial load time.
- The dashboard uses local storage to store user preferences and data.

## Components

- `UnifiedDashboard`: The main dashboard component.
- `CsvDataMapper`: A component that allows users to map columns from a CSV file to the required dashboard fields.
- `KeywordAnalyzer`: A component that provides tools for keyword analysis.
- `KeywordDeduplicator`: A component that removes duplicate keywords from a list.
- `KeywordTrendAnalyzer`: A component that analyzes keyword trends.
- `DescriptionEditor`: A component that allows users to edit product descriptions.
- `ListingQualityChecker`: A component that checks the quality of product listings.
- `ProductScoreCalculator`: A component that calculates a score for a product based on various factors.
- `FbaCalculator`: A component that calculates FBA fees.
- `AcosCalculator`: A component that calculates ACoS (Advertising Cost of Sales).
- `ProfitMarginCalculator`: A component that calculates profit margins.
- `OptimalPriceCalculator`: A component that calculates the optimal price for a product.
- `PpcCampaignAuditor`: A component that audits PPC campaigns.
- `CompetitorAnalyzer`: A component that analyzes competitors.
- `SalesEstimator`: A component that estimates sales.

## Data Flow

1.  The `UnifiedDashboard` component initializes the dashboard and sets up the tabs.
2.  The `CsvDataMapper` component allows users to upload and map data from a CSV file. The component now provides more specific error messages to the user.
3.  The data is then used to generate charts and metrics in the dashboard.
4.  The various tools in the dashboard use the data to perform calculations and analysis.
