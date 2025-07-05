import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import { AnalyticsData, ParsedFileData } from '@/types/amazon-tools';
import { filterAnalyticsDataByDateRange } from '@/lib/amazon-tools/analyticsProcessing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerReviewData } from '@/types/amazon-tools'; // Add this import

// Define a type guard for AnalyticsData[]
// Checks if the data array conforms to the basic structure expected for AnalyticsData.
const isAnalyticsDataArray = (data: unknown[]): data is AnalyticsData[] => {
  return (
    data.length === 0 ||
    (data.length > 0 &&
      typeof data[0] === 'object' &&
      data[0] !== null &&
      'totalSales' in data[0] &&
      'unitsSold' in data[0] &&
      'date' in data[0])
  );
};

interface AnalyticsProps {
  // Accepts an array of ParsedFileData where the data payload can be any type.
  // The component will filter for data payloads that match the AnalyticsData[] structure.
  parsedData: ParsedFileData<AnalyticsData>[];
  reviewData: ParsedFileData<CustomerReviewData>[]; // Add this line
}

const Analytics: React.FC<AnalyticsProps> = ({ parsedData }) => {
  // State for date range filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter for Analytics data using the type guard and flatten it
  // This runs only when parsedData changes.
  const allAnalyticsData = useMemo(() => {
    const analyticsReports = parsedData.filter((report) =>
      // Use the type guard to identify reports containing AnalyticsData[]
      isAnalyticsDataArray(report.data),
    );
    // Flatten the data from the identified analytics reports
    // We can safely cast to AnalyticsData[] here because of the filter
    return analyticsReports.flatMap((report) => report.data as AnalyticsData[]);
  }, [parsedData]);

  // Filter data based on date range whenever allAnalyticsData, startDate, or endDate changes
  const filteredAnalyticsData = useMemo(() => {
    // Return all data if date range is not fully specified or if no initial data
    if (!startDate || !endDate || allAnalyticsData.length === 0) {
      return allAnalyticsData;
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Ensure valid dates before filtering
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date format provided.');
        // Return all data or empty array based on desired behavior for invalid input
        return allAnalyticsData; // Or [] if invalid dates should result in no data
      }

      // Add one day to the end date to include the entire end day in the range
      const endPlusOneDay = new Date(end);
      endPlusOneDay.setDate(endPlusOneDay.getDate() + 1);

      return filterAnalyticsDataByDateRange(
        allAnalyticsData,
        start,
        endPlusOneDay,
      );
    } catch (error) {
      console.error('Error applying date range filter:', error);
      // Return all data or empty array in case of an unexpected filtering error
      return allAnalyticsData; // Or []
    }
  }, [allAnalyticsData, startDate, endDate]);

  // Calculate all aggregated metrics in a single pass
  // This runs only when filteredAnalyticsData changes.
  const aggregatedMetrics = useMemo(() => {
    return filteredAnalyticsData.reduce(
      (acc, item) => {
        acc.totalSales += item.totalSales || 0;
        acc.unitsSold += item.unitsSold || 0;
        // Use optional chaining and nullish coalescing for properties that might be missing
        acc.impressions += item.impressions ?? 0;
        acc.clicks += item.clicks ?? 0;
        acc.totalAcos += item.acos ?? 0;
        acc.totalRoas += item.roas ?? 0;
        acc.totalCpcValue += item.cpc ?? 0;
        return acc;
      },
      {
        totalSales: 0,
        unitsSold: 0,
        impressions: 0,
        clicks: 0,
        totalAcos: 0,
        totalRoas: 0,
        totalCpcValue: 0,
      },
    );
  }, [filteredAnalyticsData]);

  // Calculate average CPC based on aggregated value and count
  const averageCpc =
    filteredAnalyticsData.length > 0
      ? aggregatedMetrics.totalCpcValue / filteredAnalyticsData.length
      : 0;

  // Aggregate sales trend data by date
  // This runs only when filteredAnalyticsData changes.
  const aggregatedSalesTrend = useMemo(() => {
    const trendMap = new Map<string, number>();

    filteredAnalyticsData.forEach((item) => {
      // Prioritize 'date' and 'totalSales' from the primary data structure
      if (item.date && item.totalSales !== undefined) {
        const dateKey = item.date; // Assuming item.date is already in a consistent format
        const existingSales = trendMap.get(dateKey) || 0;
        trendMap.set(dateKey, existingSales + item.totalSales);
      }
      // Also consider the salesTrend array if it exists (e.g., for specific report types)
      // This part might need adjustment based on actual data structure vs ideal AnalyticsData
      item.salesTrend?.forEach((trend) => {
        const dateKey = trend.date; // Assuming trend.date is in a consistent format
        const existingSales = trendMap.get(dateKey) || 0;
        trendMap.set(dateKey, existingSales + trend.sales);
      });
    });

    // Convert map to array of objects and sort by date
    // Ensure date keys are sortable strings or convert to Date objects for sorting
    return Array.from(trendMap.entries())
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredAnalyticsData]);

  // Prepare data for the aggregated metrics bar chart
  // This runs only when aggregatedMetrics or averageCpc change.
  const aggregatedMetricsChartData = useMemo(() => {
    // Only include metrics if they are relevant to display on a bar chart as sums/averages
    return [
      {
        name: 'Total Sales',
        value: parseFloat(aggregatedMetrics.totalSales.toFixed(2)),
      },
      { name: 'Units Sold', value: aggregatedMetrics.unitsSold },
      { name: 'Impressions', value: aggregatedMetrics.impressions },
      { name: 'Clicks', value: aggregatedMetrics.clicks },
      // ACoS and ROAS are typically averages or calculated ratios, summing them isn't standard
      // { name: 'Total ACoS', value: parseFloat(aggregatedMetrics.totalAcos.toFixed(2)) },
      // { name: 'Total ROAS', value: parseFloat(aggregatedMetrics.totalRoas.toFixed(2)) },
      { name: 'Average CPC', value: parseFloat(averageCpc.toFixed(2)) },
    ].filter((item) => !isNaN(item.value)); // Filter out potential NaN values
  }, [aggregatedMetrics, averageCpc]);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
      <p className="text-lg text-muted-foreground dark:text-gray-400">
        View your Amazon seller analytics here. Data aggregated from uploaded
        reports.
      </p>

      {/* Date Range Filter */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-xl">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            disabled={!startDate && !endDate} // Disable if already clear
          >
            Clear Filter
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card for Aggregated Metrics Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4">
            <CardTitle className="text-xl">Key Aggregated Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64 w-full">
              {' '}
              {/* Added w-full */}
              {aggregatedMetricsChartData.length > 0 &&
              aggregatedMetricsChartData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aggregatedMetricsChartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-muted-foreground dark:text-gray-400 p-4 text-center">
                  {' '}
                  {/* Added p-4 text-center */}
                  No aggregated metrics data available for the selected date
                  range or metrics are zero.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Metric Cards */}
        {/* These cards can be kept or removed depending on whether the chart is sufficient */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              ${aggregatedMetrics.totalSales.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {filteredAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Units Sold</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{aggregatedMetrics.unitsSold}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {filteredAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              {aggregatedMetrics.impressions}
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {filteredAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{aggregatedMetrics.clicks}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {filteredAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total ACoS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              {aggregatedMetrics.totalAcos.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Sum of ACoS from {filteredAnalyticsData.length} entries
              (Aggregation may vary)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total ROAS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              {aggregatedMetrics.totalRoas.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Sum of ROAS from {filteredAnalyticsData.length} entries
              (Aggregation may vary)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Average CPC</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">${averageCpc.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Average Cost Per Click from {filteredAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Sales Trend Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4">
            <CardTitle className="text-xl">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64 w-full">
              {' '}
              {/* Added w-full */}
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
                    <XAxis dataKey="date" />{' '}
                    {/* Ensure date format is suitable for display */}
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
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-muted-foreground dark:text-gray-400 p-4 text-center">
                  {' '}
                  {/* Added p-4 text-center */}
                  No sales trend data available for the selected date range.
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
