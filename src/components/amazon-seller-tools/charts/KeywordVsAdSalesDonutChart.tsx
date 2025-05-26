import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardMetric {
  keyword: string;
  ad_sales: number;
  // Add other properties as needed
}

interface KeywordVsAdSalesDonutChartProps {
  sortedMetrics: DashboardMetric[];
  // Add any other props needed for styling or configuration
}

const KeywordVsAdSalesDonutChart: React.FC<KeywordVsAdSalesDonutChartProps> = ({
  sortedMetrics,


}) => {
  const chartData = useMemo(() => {
    const aggregatedData: { keyword: string; adSales: number }[] = [];

    sortedMetrics.forEach((metric) => {
      if (metric.keyword && typeof metric.ad_sales === 'number') {
        const existingKeyword = aggregatedData.find(
          (item) => item.keyword === metric.keyword,
        );
        if (existingKeyword) {
          existingKeyword.adSales += metric.ad_sales;
        } else {
          aggregatedData.push({
            keyword: metric.keyword,
            adSales: metric.ad_sales,
          });
        }
      }
    });

    // Sort by adSales in descending order
    aggregatedData.sort((a, b) => b.adSales - a.adSales);

    return aggregatedData;
  }, [sortedMetrics]);

  // Placeholder for the actual chart rendering using a charting library
  // Replace this with your actual chart implementation (e.g., Recharts, Chart.js)
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return <p>No data available for the donut chart.</p>;
    }

    return (
      <div
        style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Replace this with your actual donut chart implementation */}
        <svg width="100%" height="100%">
          <text x="50%" y="50%" textAnchor="middle" fill="gray" fontSize="16">
            Donut Chart (Keyword vs. Ad Sales)
          </text>
          {chartData.map((item, index) => (
            <circle
              key={index}
              cx="50%"
              cy="50%"
              r="40"
              fill={`hsl(${(index * 360) / chartData.length}, 70%, 70%)`}
            />
          ))}
        </svg>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">Keyword vs. Ad Sales</h3>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default KeywordVsAdSalesDonutChart;
