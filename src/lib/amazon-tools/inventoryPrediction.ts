import { InventoryData } from '@/types/amazon-tools';

interface SalesDataPoint {
  date: Date;
  unitsSold: number;
}

/**
 * Calculates the simple moving average of a series of numbers.
 * @param data - An array of numbers.
 * @param windowSize - The size of the moving average window.
 * @returns The simple moving average.
 */
function simpleMovingAverage(data: number[], windowSize: number): number {
  if (data.length < windowSize) {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }
  return data.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
}

/**
 * Predicts future inventory needs based on historical sales data.
 * @param historicalData - An array of sales data points.
 * @param daysToPredict - The number of days into the future to predict.
 * @param movingAverageWindow - The window size for the moving average calculation.
 * @returns The predicted number of units to be sold.
 */
export function predictInventory(
  historicalData: SalesDataPoint[],
  daysToPredict: number = 30,
  movingAverageWindow: number = 7,
): number {
  if (historicalData.length === 0) {
    return 0;
  }

  // Sort data by date to ensure correct order
  const sortedData = historicalData.sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const salesNumbers = sortedData.map((d) => d.unitsSold);

  const averageDailySales = simpleMovingAverage(
    salesNumbers,
    movingAverageWindow,
  );
  const predictedSales = averageDailySales * daysToPredict;

  return Math.ceil(predictedSales);
}

/**
 * Generates a reorder suggestion based on current inventory and predicted sales.
 * @param currentInventory - The current number of units in stock.
 * @param predictedSales - The predicted number of units to be sold.
 * @param leadTime - The number of days it takes for new stock to arrive.
 * @param safetyStockDays - The number of days of safety stock to maintain.
 * @returns A suggestion string.
 */
export function getReorderSuggestion(
  currentInventory: number,
  predictedSales: number,
  leadTime: number = 14, // days
  safetyStockDays: number = 7, // days
): string {
  const dailySales = predictedSales / 30; // Assuming prediction is for 30 days
  const safetyStock = dailySales * safetyStockDays;
  const reorderPoint = dailySales * leadTime + safetyStock;

  if (currentInventory <= reorderPoint) {
    const suggestedOrderQuantity = Math.ceil(
      reorderPoint - currentInventory + predictedSales,
    );
    return `Reorder soon. Suggested quantity: ${suggestedOrderQuantity} units.`;
  }

  const daysOfStockLeft = Math.floor(currentInventory / dailySales);
  if (daysOfStockLeft <= leadTime + safetyStockDays) {
    return `Low stock warning. Approximately ${daysOfStockLeft} days of stock left. Consider reordering.`;
  }

  return 'Inventory levels are sufficient.';
}
