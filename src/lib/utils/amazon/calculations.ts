// Example ACoS calculation
export function calculateAcos(adSpend: number, adSales: number): number {
  if (adSales === 0) {
    return 0; // Avoid division by zero
  }
  return (adSpend / adSales) * 100;
}

// Example Profit Margin calculation
export function calculateProfitMargin(revenue: number, costOfGoodsSold: number, otherCosts: number): number {
  const grossProfit = revenue - costOfGoodsSold - otherCosts;
  if (revenue === 0) {
    return 0;
  }
  return (grossProfit / revenue) * 100;
}
