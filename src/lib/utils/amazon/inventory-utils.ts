import type { SalesData, InventoryData } from '@/lib/amazon-types';

/**
 * Calculates a recommended inventory level based on sales, lead time, and current stock.
 *
 * @param salesData Array of historical sales figures (e.g., daily sales).
 * @param leadTime Lead time in the same unit as sales data period (e.g., days).
 * @param currentInventory Current units in stock.
 * @returns Recommended inventory level.
 */
export const calculateInventoryRecommendation = (
  salesData: number[],
  leadTime: number,
  currentInventory: number,
): number => {
  // Basic calculation: peak sales during lead time minus current inventory
  if (!salesData || salesData.length === 0 || leadTime <= 0) {
    console.warn(
      'Invalid input for calculateInventoryRecommendation. Sales data must be provided and lead time must be positive.',
    );
    return 0; // Cannot make a recommendation without valid data
  }

  const peakSales = Math.max(...salesData);
  const recommendedStock = peakSales * leadTime;

  // Return the quantity needed to reach the recommended stock level
  return recommendedStock - currentInventory;
};

import { InventoryHealthStatus } from '@/lib/amazon-types';

/**
 * Assesses the health of the inventory based on current stock, safety stock, and sales velocity.
 *
 * @param inventoryData - Data related to product inventory.
 * @returns The inventory health status.
 */
export const assessInventoryHealth = (
  inventoryData: InventoryData,
): InventoryData['status'] => {
  const { currentInventory, safetyStock, averageDailySales } = inventoryData;

  if (currentInventory <= 0) {
    return InventoryHealthStatus.CRITICAL; // Out of stock or near zero
  }

  if (currentInventory < safetyStock) {
    return InventoryHealthStatus.LOW; // Below safety stock
  }

  // Simple check for excess: if current inventory is more than X days of average sales
  const EXCESS_STOCK_DAYS = 90; // Example: Flag if stock is more than 90 days of sales
  if (
    averageDailySales > 0 &&
    currentInventory / averageDailySales > EXCESS_STOCK_DAYS
  ) {
    return InventoryHealthStatus.EXCESS; // Holding too much stock
  }

  return InventoryHealthStatus.HEALTHY; // Otherwise, considered healthy
};
