# IndexedDB Integration Documentation

## 1. Overview

This document describes the IndexedDB integration for the Amazon Seller Tools dashboard. IndexedDB is used for local, browser-based data storage. This allows the tools to store user-specific data, such as saved calculations and preferences, improving performance and enabling offline functionality.

## 2. Implementation

The `src/lib/indexeddb-service.ts` file provides an interface for interacting with the IndexedDB database.

### 2.1. Key Functions

- `initializeDB()`: Initializes the IndexedDB database.
- `saveCalculation(data: CalculationData)`: Saves a calculation to IndexedDB.
- `getCalculations()`: Retrieves all calculations from IndexedDB.
- `getItem<T>(key: string)`: Retrieves an item from IndexedDB by key.
- `setItem<T>(key: string, value: T)`: Saves an item to IndexedDB with a key.
- `deleteItem(key: string)`: Deletes an item from IndexedDB by key.

### 2.2. Data Structure

The following data structure is used for saving calculations:

```typescript
export interface CalculationData {
  campaignName: string;
  date: string;
  adSpend: number;
  sales: number;
  acos: number;
  roas: number;
}
```

## 3. Usage

The `saveCalculation` and `getCalculations` functions are used in the ACoS calculator to save and retrieve calculation history.

## 4. Error Handling

The `logError` function is used to log errors that occur during IndexedDB operations.

## 5. Future Improvements

- Implement more robust error handling.
- Add support for storing other types of data, such as user preferences.
