import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { AnalyticsData, ParsedFileData } from '@/types/amazon-tools'; // Import ParsedFileData

interface AnalyticsProps {
  parsedData: ParsedFileData<AnalyticsData>[];
}

const Analytics: React.FC<AnalyticsProps> = ({ parsedData }) => {
  // Filter for Analytics data and flatten it
  const analyticsReports = parsedData.filter(
    (report): report is ParsedFileData<AnalyticsData> => {
      // Assuming there's a way to identify analytics data, e.g., by file name pattern or a category property if added to ParsedFileData
      // For now, we'll assume any data passed here is intended for analytics or check structure
      // A more robust solution would involve categorizing data in DataSourceTab and passing categorized data
      // Let's assume for now that parsedData contains only AnalyticsData or we can filter based on data structure
      // A simple check: does the first item (if exists) have 'totalSales' and 'unitsSold'?
      return (
        report.data.length > 0 &&
        'totalSales' in report.data[0] &&
        'unitsSold' in report.data[0]
      );
    },
  );

  const allAnalyticsData = analyticsReports.flatMap((report) => report.data);

  // Calculate total sales, units sold, and aggregate other metrics
  const totalSales = allAnalyticsData.reduce(
    (sum, item) => sum + (item.totalSales || 0),
    0,
  );
  const totalUnitsSold = allAnalyticsData.reduce(
    (sum, item) => sum + (item.unitsSold || 0),
    0,
  );
  const totalImpressions = allAnalyticsData.reduce(
    (sum, item) => sum + (item.impressions || 0),
    0,
  );
  const totalClicks = allAnalyticsData.reduce(
    (sum, item) => sum + (item.clicks || 0),
    0,
  );
  // ACoS and ROAS are typically calculated per campaign/period, averaging might not be meaningful without more context.
  // For simplicity, we'll just display the sum of available values, but a real-world scenario would need more complex aggregation.
  const totalAcos = allAnalyticsData.reduce(
    (sum, item) => sum + (item.acos || 0),
    0,
  );
  const totalRoas = allAnalyticsData.reduce(
    (sum, item) => sum + (item.roas || 0),
    0,
  );
  const averageCpc =
    allAnalyticsData.length > 0
      ? allAnalyticsData.reduce((sum, item) => sum + (item.cpc || 0), 0) /
        allAnalyticsData.length
      : 0;

  const aggregatedSalesTrend = React.useMemo(() => {
    const trendMap = new Map<string, number>(); // Map to store sales by date

    allAnalyticsData.forEach((item) => {
      // Use the 'date' field from the transformed data
      if (item.date && item.totalSales !== undefined) {
        const existingSales = trendMap.get(item.date) || 0;
        trendMap.set(item.date, existingSales + item.totalSales);
      }
      // Also consider the salesTrend array if it exists (for backward compatibility or specific report types)
      item.salesTrend?.forEach((trend) => {
        const existingSales = trendMap.get(trend.date) || 0;
        trendMap.set(trend.date, existingSales + trend.sales);
      });
    });

    // Convert map to array of objects and sort by date
    return Array.from(trendMap.entries())
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allAnalyticsData]);

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      <p className="text-muted-foreground dark:text-gray-400">
        View your Amazon seller analytics here. Data aggregated from uploaded
        reports.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card for Total Sales */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {allAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Card for Units Sold */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Units Sold</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalUnitsSold}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {allAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Card for Total Impressions */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalImpressions}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {allAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Card for Total Clicks */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalClicks}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {allAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Card for Total ACoS (Note: Aggregation might not be ideal) */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total ACoS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalAcos.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Sum of ACoS from {allAnalyticsData.length} entries (Aggregation
              may vary)
            </p>
          </CardContent>
        </Card>

        {/* Card for Total ROAS (Note: Aggregation might not be ideal) */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total ROAS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalRoas.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Sum of ROAS from {allAnalyticsData.length} entries (Aggregation
              may vary)
            </p>
          </CardContent>
        </Card>

        {/* Card for Average CPC */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Average CPC</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">${averageCpc.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Average Cost Per Click from {allAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Sales Trend Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64">
              {aggregatedSalesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={aggregatedSalesTrend}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-muted-foreground dark:text-gray-400">
                  No sales trend data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
