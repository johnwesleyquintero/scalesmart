import { AnalyticsData } from '@/types/amazon-tools';
import { isWithinInterval, parseISO } from 'date-fns';

/**
 * Calculates the weighted average ACoS (Advertising Cost of Sales) for a set of analytics data.
 * Weighted average ACoS = (Total Ad Spend / Total Sales) * 100
 * Assumes ACoS in AnalyticsData is already a percentage or can be converted.
 * @param data An array of AnalyticsData objects.
 * @returns The weighted average ACoS, or 0 if no data or total sales are zero.
 */
export function calculateWeightedAverageACoS(data: AnalyticsData[]): number {
  let totalAdSpend = 0;
  let totalSales = 0;

  data.forEach((item) => {
    // Assuming ACoS is provided as a percentage (e.g., 20 for 20%)
    // If ACoS is a decimal (e.g., 0.20), adjust calculation accordingly.
    // We need ad spend, which is not directly in AnalyticsData.
    // ACoS = (Ad Spend / Sales) * 100 => Ad Spend = (ACoS / 100) * Sales
    // If ACoS is missing, we cannot calculate ad spend for this item.
    if (item.acos !== undefined && item.totalSales !== undefined) {
      totalAdSpend += (item.acos / 100) * item.totalSales;
      totalSales += item.totalSales;
    }
  });

  if (totalSales === 0) {
    return 0;
  }

  return (totalAdSpend / totalSales) * 100;
}

/**
 * Filters analytics data to include only entries within a specified date range.
 * @param data An array of AnalyticsData objects.
 * @param startDate The start date of the range (inclusive) as a Date object.
 * @param endDate The end date of the range (inclusive) as a Date object.
 * @returns An array of AnalyticsData objects within the specified date range.
 */
export function filterAnalyticsDataByDateRange(
  data: AnalyticsData[],
  startDate: Date,
  endDate: Date,
): AnalyticsData[] {
  return data.filter((item) => {
    if (!item.date) {
      return false; // Exclude items without a date
    }
    const itemDate = parseISO(item.date);
    // Check if the parsed date is valid before checking the interval
    if (isNaN(itemDate.getTime())) {
      console.warn(`Invalid date found in analytics data: ${item.date}`);
      return false; // Exclude items with invalid dates
    }
    return isWithinInterval(itemDate, { start: startDate, end: endDate });
  });
}

// You can add more aggregation functions here, e.g., calculate total sales, average units sold, etc.
