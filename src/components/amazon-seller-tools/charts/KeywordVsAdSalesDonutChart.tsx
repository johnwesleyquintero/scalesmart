import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
} from 'recharts';
import { useTheme } from 'next-themes'; // Correct import path for useTheme
import type { DashboardMetrics } from '@/lib/amazon-tools/types';
import { formatCurrency } from '@/lib/utils/amazon/chart-formatters';
import { PIE_CHART_COLORS } from '@/lib/constants/chart-colors';

const COLORS = PIE_CHART_COLORS;

interface DashboardMetric {
  targeted_keyword?: string;
  ad_sales?: number;
}

interface KeywordVsAdSalesDonutChartProps {
  sortedMetrics: DashboardMetric[];
  title: string;
}

const KeywordVsAdSalesDonutChart: React.FC<KeywordVsAdSalesDonutChartProps> = ({
  sortedMetrics,
  title,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const chartData = useMemo(() => {
    const aggregatedData: { keyword: string; adSales: number }[] = [];

    sortedMetrics.forEach((metric) => {
      if (
        metric.targeted_keyword &&
        typeof metric.targeted_keyword === 'string' &&
        typeof metric.ad_sales === 'number' &&
        metric.ad_sales > 0
      ) {
        const existingKeyword = aggregatedData.find(
          (item) => item.keyword === metric.targeted_keyword,
        );
        if (existingKeyword) {
          existingKeyword.adSales += metric.ad_sales;
        } else {
          aggregatedData.push({
            keyword: metric.targeted_keyword,
            adSales: metric.ad_sales,
          });
        }
      }
    });

    const TOP_KEYWORD_DISPLAY_LIMIT = 10; // Defines the number of top keywords to display before aggregating to 'Other'
    const topKeywords = aggregatedData
      .sort((a, b) => b.adSales - a.adSales)
      .slice(0, TOP_KEYWORD_DISPLAY_LIMIT);
    const otherSales = aggregatedData
      .slice(TOP_KEYWORD_DISPLAY_LIMIT)
      .reduce((sum, item) => sum + item.adSales, 0);

    if (otherSales > 0) {
      topKeywords.push({ keyword: 'Other', adSales: otherSales });
    }

    return topKeywords;
  }, [sortedMetrics]);

  const CustomTooltip = useCallback(
    ({
      active,
      payload,
    }: {
      active?: boolean;
      payload?:
        | {
            name: string;
            value: number;
            payload: { keyword: string; adSales: number };
          }[]
        | null;
    }) => {
      if (active && payload && payload?.length) {
        const data = payload[0].payload;
        return (
          <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
            <p className="text-sm font-bold">{data.keyword}</p>
            <p className="text-xs">Ad Sales: {formatCurrency(data.adSales)}</p>
          </div>
        );
      }
      return null;
    },
    [],
  );

  const renderCustomizedLabel = useCallback(
    ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
      index,
    }: PieLabelRenderProps) => {
      const numericCx = Number(cx);
      const numericCy = Number(cy);
      const numericInnerRadius = Number(innerRadius);
      const numericOuterRadius = Number(outerRadius);
      const numericValue = Number(value);

      const RADIAN = Math.PI / 180;
      const radius =
        numericInnerRadius + (numericOuterRadius - numericInnerRadius) * 0.5;
      const x = numericCx + radius * Math.cos(-midAngle * RADIAN);
      const y = numericCy + radius * Math.sin(-midAngle * RADIAN);

      if (numericValue > 0) {
        return (
          <text
            x={x}
            y={y}
            fill={isDarkMode ? '#000' : '#FFF'} // Use the outer isDarkMode
            textAnchor={x > numericCx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize="12px"
            fontWeight="bold"
            aria-label={`${chartData[Number(index)]?.keyword || 'Segment'}: ${value}`}
          >
            {numericValue && formatCurrency(numericValue)}
          </text>
        );
      }
      return null;
    },
    [chartData, isDarkMode], // Include isDarkMode in dependencies
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 relative">
        {chartData.length === 0 ? (
          <p className="text-center text-gray-500 mt-4">
            No ad sales data available for keywords.
          </p>
        ) : (
          <div className="h-full flex flex-col justify-center items-center">
            <ResponsiveContainer
              width="100%"
              height={300}
              aria-label="Keyword vs. Ad Sales Donut Chart"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="adSales"
                  nameKey="keyword"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  aria-label="Donut chart showing breakdown of ad sales by keyword"
                >
                  {chartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KeywordVsAdSalesDonutChart;
