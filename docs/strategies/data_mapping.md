# Standardizing Data Mapping Across WesTools

## Table of Contents

- [Introduction](#introduction)
- [Current Situation](#current-situation)
- [Proposed Solution](#proposed-solution)
  - [1. Define Standard "Wes-Verse" Data Structures](#1-define-standard-wes-verse-data-structures)
  - [2. Create a Generic CsvDataMapper](#2-create-a-generic-csvdatamapper)
  - [3. Centralized Mapping Logic](#3-centralized-mapping-logic)
- [Example Workflow](#example-workflow)
- [Benefits](#benefits)
- [Potential Enhancements](#potential-enhancements)
- [Challenges and Considerations](#challenges-and-considerations)
- [Conclusion](#conclusion)

## Introduction

Standardizing data mapping across all "WesTools" is a strategic move to create a consistent and efficient data ingestion process. This document outlines a concept for achieving this standardization, focusing on reusability, flexibility, and maintainability.

## Current Situation

Currently, each tool (e.g., [`src\components\amazon-seller-tools\fba-calculator.tsx`](src\components\amazon-seller-tools\fba-calculator.tsx), [`src\components\amazon-seller-tools\keyword-analyzer.tsx`](src\components\amazon-seller-tools\keyword-analyzer.tsx), and [`src\components\amazon-seller-tools\ppc-campaign-auditor.tsx`](src\components\amazon-seller-tools\ppc-campaign-auditor.tsx)) has its own way of expecting and processing CSV data.

The [`src\components\amazon-seller-tools\CsvDataMapper.tsx`](src\components\amazon-seller-tools\CsvDataMapper.tsx) component is a good starting point for the [`src\app\amazon-seller-tools\page.tsx`](src\app\amazon-seller-tools\page.tsx) (Unified Dashboard). The goal is to create a similar, enhanced version that can be reused across all tools that take CSV input.

## Proposed Solution

The following steps outline a concept for standardizing data mapping:

### 1. Define Standard "Wes-Verse" Data Structures

For each type of data your tools work with (e.g., FBA data, keyword data, PPC campaign data, listing data), define a clear, standardized internal data structure (like your `DashboardMetrics` interface in [`src\app\amazon-seller-tools\page.tsx`](src\app\amazon-seller-tools\page.tsx) or `CampaignData` in [`src\components\amazon-seller-tools\ppc-campaign-auditor.tsx`](src\components\amazon-seller-tools\ppc-campaign-auditor.tsx)). This is the "target" format you always want to map to.

### 2. Create a Generic CsvDataMapper

Your current [`src\components\amazon-seller-tools\CsvDataMapper.tsx`](src\components\amazon-seller-tools\CsvDataMapper.tsx) is a good foundation. To make it more universal:

- **Configuration-Driven:** Instead of hardcoding `TARGET_METRICS_CONFIG` inside the UnifiedDashboard ([`src\app\amazon-seller-tools\page.tsx`](src\app\amazon-seller-tools\page.tsx)), each tool that uses the mapper would provide its own configuration. This configuration would tell the mapper:
  - What are the target fields (e.g., `productName`, `cost`, `sales`, `keyword`, `searchVolume`).
  - What are their display labels for the mapping UI.
  - Which fields are required.
  - Optionally, any validation rules or transformation functions for each field (e.g., convert to number, trim string, parse date).

### 3. Centralized Mapping Logic

The core logic for presenting the mapping UI (dropdowns for each target field, populated with CSV headers) would live in this enhanced, generic `CsvDataMapper`.

The logic for taking the user's mapping and transforming the raw CSV rows into your standardized internal data structures would also be part of this, or a closely related utility.

## Example Workflow

Consider the following workflow for a tool like `FbaCalculator`:

1.  **User Uploads CSV:** The [`src\components\amazon-seller-tools\fba-calculator.tsx`](src\components\amazon-seller-tools\fba-calculator.tsx) uses a generic file upload component.
2.  **Get CSV Headers:** PapaParse (or similar) reads the headers from the uploaded CSV.
3.  **Invoke Generic Mapper:**
    - The `FbaCalculator` calls your generic `CsvDataMapper`.
    - It passes the `csvHeaders` and its specific `fbaTargetMetricsConfig` (defining fields like `product`, `cost`, `price`, `fees`).
4.  **User Maps Columns:** The user interacts with the `CsvDataMapper` UI.
5.  **Mapping Complete:** The `CsvDataMapper` returns the mapping (e.g., `{ product: 'Product Name from CSV', cost: 'Item Cost from CSV', ... }`).
6.  **Transform Data:**
    - The `FbaCalculator` (or a utility function it calls) then uses this mapping to iterate over the full CSV data.
    - For each row, it extracts the values based on the mapping and transforms them into your standard `FbaCalculationInput` structure.
    - This transformation step could also handle basic type conversions (string to number) and validation.
7.  **Process Data:** The `FbaCalculator` now has an array of standardized `FbaCalculationInput` objects and can proceed with its calculations.

## Benefits

- **Consistency:** Users get a familiar mapping experience across all your tools.
- **Reusability:** You write the core mapping UI and logic once.
- **Flexibility:** Each tool just needs to define its target data structure and mapping configuration.
- **Easier Maintenance:** If you need to improve the mapping UI, you do it in one place.

## Potential Enhancements

- **Auto-Suggestion:** Try to auto-suggest mappings based on common header names.
- **Data Preview:** Show a few rows of the CSV data to help users map correctly.
- **Saving Mappings:** For users who frequently upload CSVs with the same format, allow them to save and reuse their mappings.
- **Advanced Transformations:** For more complex scenarios, allow users to define simple transformations (e.g., combine two CSV columns into one target field, apply a formula).

## Challenges and Considerations

- **CSV Format Variations:** Handling different CSV delimiters, encodings, and quoting conventions.
- **Missing Data:** Strategies for dealing with missing values in the CSV data.
- **Invalid Data:** Validation and error handling for incorrect data types or formats.
- **Performance:** Optimizing the mapping and transformation process for large CSV files.

## Conclusion

Refactoring your tools to use a standardized mapper is a significant undertaking, but the long-term benefits in terms of user experience and code maintainability are substantial. This approach establishes a core data ingestion and normalization layer, promoting consistency and efficiency across the "Wes-verse."
