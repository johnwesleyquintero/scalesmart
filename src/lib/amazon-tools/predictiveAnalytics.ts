/**
 * This file contains functions for performing predictive analytics on product data.
 */

/**
 * Analyzes historical sales data to identify emerging product trends.
 * @param salesData An array of sales data objects.
 * @returns An array of product trends.
 */
export interface SalesData {
  date: string; // Or Date, depending on how it's passed
  sales: number;
  productId: string;
}

export interface ProductTrend {
  productId: string;
  trend: number; // e.g., slope of sales over time
  startDate: string;
  endDate: string;
}

export interface MarketOpportunity {
  productId: string;
  opportunityScore: number;
  description: string;
}

/**
 * Analyzes historical sales data to identify emerging product trends using a simple linear regression.
 * @param salesData An array of sales data objects.
 * @returns An array of product trends.
 */
export const analyzeProductTrends = (
  salesData: SalesData[],
): ProductTrend[] => {
  const productTrends: ProductTrend[] = [];
  const products = [...new Set(salesData.map((d) => d.productId))];

  products.forEach((productId) => {
    const productSales = salesData
      .filter((d) => d.productId === productId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (productSales.length < 2) {
      // Not enough data to determine a trend
      return;
    }

    // Simple linear regression to find the trend (slope)
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = productSales.length;

    productSales.forEach((dataPoint, index) => {
      const x = index; // Use index as the x-value (time proxy)
      const y = dataPoint.sales;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    productTrends.push({
      productId,
      trend: slope,
      startDate: productSales[0].date,
      endDate: productSales[n - 1].date,
    });
  });

  return productTrends;
};

/**
 * Identifies market opportunities based on product trends and other factors.
 * @param productTrends An array of product trends.
 * @returns An array of market opportunities.
 */
export const identifyMarketOpportunities = (
  productTrends: ProductTrend[],
): MarketOpportunity[] => {
  const marketOpportunities: MarketOpportunity[] = [];

  // Sort trends by the highest positive trend first
  const sortedTrends = [...productTrends].sort((a, b) => b.trend - a.trend);

  sortedTrends.forEach((trend) => {
    let opportunityScore = 0;
    let description = '';

    if (trend.trend > 0.5) {
      // Strong positive trend
      opportunityScore = 90;
      description = `High growth potential: Sales for ${trend.productId} are showing a strong upward trend. Consider increasing inventory and marketing efforts.`;
    } else if (trend.trend > 0.1) {
      // Moderate positive trend
      opportunityScore = 70;
      description = `Moderate growth: Sales for ${trend.productId} are steadily increasing. Monitor closely for sustained growth.`;
    } else if (trend.trend < -0.5) {
      // Strong negative trend
      opportunityScore = 20;
      description = `Declining sales: Sales for ${trend.productId} are significantly decreasing. Evaluate product viability or adjust strategy.`;
    } else if (trend.trend < -0.1) {
      // Moderate negative trend
      opportunityScore = 40;
      description = `Slight decline: Sales for ${trend.productId} are slowly decreasing. Investigate potential causes.`;
    } else {
      // Stable or flat trend
      opportunityScore = 50;
      description = `Stable performance: Sales for ${trend.productId} are relatively flat. Look for new strategies to boost growth.`;
    }

    marketOpportunities.push({
      productId: trend.productId,
      opportunityScore,
      description,
    });
  });

  return marketOpportunities;
};
