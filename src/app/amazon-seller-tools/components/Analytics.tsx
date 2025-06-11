import React, { useState, useMemo } from 'react'; // Import useState and useMemo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button component
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart, // Add BarChart import
  Bar, // Add Bar import
} from 'recharts';

import {
  AnalyticsData,
  ParsedFileData,
  CustomerReviewData,
} from '@/types/amazon-tools'; // Import ParsedFileData and CustomerReviewData
import { filterAnalyticsDataByDateRange } from '@/lib/amazon-tools/analyticsProcessing'; // Import the filtering function
import { Input } from '@/components/ui/input'; // Import Input for date pickers
import { Label } from '@/components/ui/label'; // Import Label

interface AnalyticsProps {
  parsedData: ParsedFileData<AnalyticsData>[];
  reviewData: ParsedFileData<CustomerReviewData>[];
}

const Analytics: React.FC<AnalyticsProps> = ({ parsedData }) => {
  // State for date range filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // State for AI insights
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);

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

  // Filter data based on date range whenever parsedData, startDate, or endDate changes
  const filteredAnalyticsData = useMemo(() => {
    if (!startDate || !endDate) {
      return allAnalyticsData; // Return all data if no date range is set
    }
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Ensure valid dates before filtering
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date format for filtering.');
        return allAnalyticsData; // Return all data if dates are invalid
      }
      return filterAnalyticsDataByDateRange(allAnalyticsData, start, end);
    } catch (error) {
      console.error('Error applying date range filter:', error);
      return allAnalyticsData; // Return all data in case of error
    }
  }, [allAnalyticsData, startDate, endDate]); // Depend on allAnalyticsData, startDate, and endDate

  // Calculate total sales, units sold, and aggregate other metrics from filtered data
  const totalSales = filteredAnalyticsData.reduce(
    (sum, item) => sum + (item.totalSales || 0),
    0,
  );
  const totalUnitsSold = filteredAnalyticsData.reduce(
    (sum, item) => sum + (item.unitsSold || 0),
    0,
  );
  const totalImpressions = filteredAnalyticsData.reduce(
    (sum, item) => sum + (item.impressions || 0),
    0,
  );
  const totalClicks = filteredAnalyticsData.reduce(
    (sum, item) => sum + (item.clicks || 0),
    0,
  );
  // ACoS and ROAS are typically calculated per campaign/period, averaging might not be meaningful without more context.
  // For simplicity, we'll just display the sum of available values, but a real-world scenario would need more complex aggregation.
  const totalAcos = filteredAnalyticsData.reduce(
    (sum, item) => sum + (item.acos || 0),
    0,
  );
  const totalRoas = filteredAnalyticsData.reduce(
    (sum, item) => sum + (item.roas || 0),
    0,
  );
  const averageCpc =
    filteredAnalyticsData.length > 0
      ? filteredAnalyticsData.reduce((sum, item) => sum + (item.cpc || 0), 0) /
        filteredAnalyticsData.length
      : 0;

  const aggregatedSalesTrend = useMemo(() => {
    // Use useMemo here
    const trendMap = new Map<string, number>(); // Map to store sales by date

    filteredAnalyticsData.forEach((item) => {
      // Use filtered data
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
  }, [filteredAnalyticsData]); // Depend on filteredAnalyticsData

  // Prepare data for the aggregated metrics bar chart
  const aggregatedMetricsData = [
    { name: 'Total Sales', value: totalSales },
    { name: 'Units Sold', value: totalUnitsSold },
    { name: 'Impressions', value: totalImpressions },
    { name: 'Clicks', value: totalClicks },
    // ACoS and ROAS might need different visualization or aggregation
    // { name: 'Total ACoS', value: totalAcos },
    // { name: 'Total ROAS', value: totalRoas },
    { name: 'Average CPC', value: averageCpc },
  ];

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      <p className="text-muted-foreground dark:text-gray-400">
        View your Amazon seller analytics here. Data aggregated from uploaded
        reports.
      </p>

      {/* Date Range Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

      {/* AI-Powered Insights Section */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Button
            onClick={async () => {
              setLoadingInsights(true);
              setInsightError(null);
              setAiInsights(null);
              try {
                const { getAIDrivenRecommendation } = await import(
                  '@/lib/amazon-tools/gemini-api'
                );
                // Construct a prompt based on the filtered data
                const prompt = `Analyze the following Amazon seller analytics data for the period ${startDate} to ${endDate} and provide key insights and actionable recommendations.

Aggregated Metrics:
Total Sales: ${totalSales.toFixed(2)}
Units Sold: ${totalUnitsSold}
Impressions: ${totalImpressions}
Clicks: ${totalClicks}
Total ACoS: ${totalAcos.toFixed(2)}%
Total ROAS: ${totalRoas.toFixed(2)}
Average CPC: ${averageCpc.toFixed(2)}

Sales Trend Data (Date, Sales):
${aggregatedSalesTrend.map((item) => `${item.date}: ${item.sales.toFixed(2)}`).join('\\n')}

Provide insights on performance trends, areas for improvement, and specific actions the seller can take to increase sales and profitability.`;

                const insights = await getAIDrivenRecommendation(prompt);
                setAiInsights(insights);
              } catch (error: unknown) {
                // Replace any with unknown
                console.error('Error generating AI insights:', error);
                // Safely access error message
                setInsightError(
                  error instanceof Error
                    ? error.message
                    : 'Failed to generate AI insights.',
                );
              } finally {
                setLoadingInsights(false);
              }
            }}
            disabled={loadingInsights || filteredAnalyticsData.length === 0}
          >
            {loadingInsights
              ? 'Generating Insights...'
              : 'Generate AI Insights'}
          </Button>

          {insightError && (
            <p className="text-red-600 dark:text-red-400 mt-2">
              Error: {insightError}
            </p>
          )}

          {aiInsights && (
            <div className="mt-4 p-4 bg-gray-200 dark:bg-gray-700 rounded-md whitespace-pre-wrap">
              <h4 className="text-lg font-semibold mb-2">Insights:</h4>
              {aiInsights}
            </div>
          )}

          {!loadingInsights &&
            !insightError &&
            !aiInsights &&
            filteredAnalyticsData.length > 0 && (
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Click "Generate AI Insights" to get insights based on the
                filtered data.
              </p>
            )}
          {!loadingInsights &&
            !insightError &&
            filteredAnalyticsData.length === 0 && (
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Upload analytics data and select a date range to generate
                insights.
              </p>
            )}
        </CardContent>
      </Card>

      {/* AI-Powered PPC Optimization Section */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">AI-Powered PPC Optimization</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-muted-foreground dark:text-gray-400 mb-4">
            Get AI-driven recommendations to optimize your PPC campaigns based
            on your analytics data.
          </p>
          <Button
            onClick={async () => {
              setLoadingInsights(true); // Reuse loading state for simplicity
              setInsightError(null); // Reuse error state
              setAiInsights(null); // Clear previous insights
              try {
                const { getAIDrivenRecommendation } = await import(
                  '@/lib/amazon-tools/gemini-api'
                );
                // Construct a prompt specifically for PPC optimization
                const prompt = `Analyze the following Amazon seller analytics data for the period ${startDate} to ${endDate} focusing on PPC performance. Provide actionable recommendations to optimize PPC campaigns, including suggestions for keyword targeting, bid adjustments, and budget allocation.
 
 Aggregated PPC Metrics:
 Impressions: ${totalImpressions}
 Clicks: ${totalClicks}
 Total ACoS: ${totalAcos.toFixed(2)}%
 Total ROAS: ${totalRoas.toFixed(2)}
 Average CPC: ${averageCpc.toFixed(2)}
 
 Sales Trend Data (Date, Sales - for context):
 ${aggregatedSalesTrend.map((item) => `${item.date}: ${item.sales.toFixed(2)}`).join('\\n')}
 
 Provide specific, actionable steps to improve PPC performance.`;

                const insights = await getAIDrivenRecommendation(prompt);
                setAiInsights(insights); // Display insights in the same section for now
              } catch (error: unknown) {
                console.error(
                  'Error generating AI PPC optimization insights:',
                  error,
                );
                setInsightError(
                  error instanceof Error
                    ? error.message
                    : 'Failed to generate AI PPC optimization insights.',
                );
              } finally {
                setLoadingInsights(false);
              }
            }}
            disabled={loadingInsights || filteredAnalyticsData.length === 0}
          >
            {loadingInsights
              ? 'Generating PPC Recommendations...'
              : 'Generate PPC Optimization Recommendations'}
          </Button>

          {/* Display insights and errors in the same area for now */}
          {insightError && (
            <p className="text-red-600 dark:text-red-400 mt-2">
              Error: {insightError}
            </p>
          )}

          {aiInsights && (
            <div className="mt-4 p-4 bg-gray-200 dark:bg-gray-700 rounded-md whitespace-pre-wrap">
              <h4 className="text-lg font-semibold mb-2">
                PPC Optimization Recommendations:
              </h4>
              {aiInsights}
            </div>
          )}

          {!loadingInsights &&
            !insightError &&
            !aiInsights &&
            filteredAnalyticsData.length > 0 && (
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Click "Generate PPC Optimization Recommendations" to get
                AI-driven suggestions.
              </p>
            )}
          {!loadingInsights &&
            !insightError &&
            filteredAnalyticsData.length === 0 && (
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Upload analytics data and select a date range to generate PPC
                optimization recommendations.
              </p>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card for Aggregated Metrics Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Key Aggregated Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64">
              {aggregatedMetricsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aggregatedMetricsData}
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
                <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-muted-foreground dark:text-gray-400">
                  No aggregated metrics data available for the selected date
                  range.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card for Total Sales */}
        {/* Keeping individual cards for now, can be removed later if chart is sufficient */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Data from {filteredAnalyticsData.length} entries
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
              Data from {filteredAnalyticsData.length} entries
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
              Data from {filteredAnalyticsData.length} entries
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
              Data from {filteredAnalyticsData.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total ACoS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalAcos.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Sum of ACoS from {filteredAnalyticsData.length} entries
              (Aggregation may vary)
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
              Sum of ROAS from {filteredAnalyticsData.length} entries
              (Aggregation may vary)
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
              Average Cost Per Click from {filteredAnalyticsData.length} entries
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
