import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ParsedFileData<T> {
  fileName: string;
  data: T[];
}

interface AnalyticsProps {
  parsedData: ParsedFileData<Record<string, unknown>>[];
}

const Analytics: React.FC<AnalyticsProps> = ({ parsedData }) => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      <p className="text-muted-foreground dark:text-gray-400">
        View your Amazon seller analytics here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder Card for a key metric */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Total Sales (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">$0.00</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              +0% vs last period
            </p>
          </CardContent>
        </Card>

        {/* Placeholder Card for another key metric */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Units Sold (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              +0% vs last period
            </p>
          </CardContent>
        </Card>

        {/* Placeholder Card for a chart area */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">
              Sales Trend (Placeholder Chart)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-muted-foreground dark:text-gray-400">
              [Placeholder for Chart]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
