'use client';

import React, { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import types
import type {
  DashboardMetrics,
  TimeRange,
  TargetMetricConfig,
  AggregatedProductMetrics, // Import AggregatedProductMetrics
} from '@/lib/amazon-tools/types';
import type { CsvColumnMapping } from '@/types/data-mapping';
import type { TransformationError } from '@/lib/utils/amazon/data-transformation';
import type { TableChartProps } from '@/components/amazon-seller-tools/charts/TableChart';

// Define a type for table columns
interface TableColumn {
  accessorKey: string;
  header: string;
  copyable?: boolean;
  analyzeInTool?: { toolName: string; paramName: string };
}

// Import components
import { OverviewLoadingIndicator } from './OverviewLoadingIndicator';
import { OverviewErrorDisplay } from './OverviewErrorDisplay';
import { OverviewDataMapper } from './OverviewDataMapper';
import { PlaceholderChartContainer } from './PlaceholderChartContainer';
import { OverviewDataView } from './OverviewDataView';
import DataCard from '../DataCard';

// Import sample data
import {
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
} from '@/data/amazon-tools-sample-data/amazon-dashboard-sample-data';

// Lazy load charts
const SalesTrendsChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/SalesTrendsChart').then(
    (module) => ({ default: module.SalesTrendsChart }),
  ),
);
const ClicksImpressionsChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/ClicksImpressionsChart').then(
    (module) => ({ default: module.ClicksImpressionsChart }),
  ),
);
const OrdersSessionsChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/OrdersSessionsChart').then(
    (module) => ({ default: module.OrdersSessionsChart }),
  ),
);
const AdSpendSalesChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/AdSpendSalesChart').then(
    (module) => ({ default: module.AdSpendSalesChart }),
  ),
);
const ProfitTrendChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/ProfitTrendChart').then(
    (module) => ({ default: module.ProfitTrendChart }),
  ),
);
const KeywordVsAdSalesDonutChart = lazy(
  () =>
    import(
      '@/components/amazon-seller-tools/charts/KeywordVsAdSalesDonutChart'
    ),
);
const TableChart = lazy(
  () => import('@/components/amazon-seller-tools/charts/TableChart'),
) as React.LazyExoticComponent<
  React.FC<TableChartProps<AggregatedProductMetrics>>
>;
const KeywordPerformanceOverviewTable = lazy(
  () => import('../KeywordPerformanceOverviewTable'),
);

interface OverviewTabContentDisplayProps {
  showMapperFlag: boolean;
  csvHeaders: string[];
  error: string | null;
  parsingErrors: TransformationError[];
  isLoading: boolean;
  metrics: DashboardMetrics[];
  overviewDataMapperKey: number;
  TARGET_METRICS_CONFIG: readonly TargetMetricConfig[];
  handleMappingComplete: (mapping: CsvColumnMapping) => Promise<void>;
  firstCsvDataRow?: Record<string, string>;
  handleMappingCancel: () => void;
  savedMapping: CsvColumnMapping | null;
  handleUploadClick: () => void;
  selectedMetricsForDataView: string[];
  aggregatedAndSortedMetrics: DashboardMetrics[];
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  setTimeGranularity: (
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  ) => void;
  onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  setCustomDateRange: React.Dispatch<
    React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>
  >;
  totalRows: number;
  processedRows: number;
  isUploading: boolean;
  isParsing: boolean;
  isProcessing: boolean;
  showKeywordPerformanceTable: boolean;
  productPerformanceData: AggregatedProductMetrics[];
  productPerformanceTableColumns: TableColumn[]; // Use the defined TableColumn type
  productPerformanceRowIdAccessor: (row: AggregatedProductMetrics) => string;
  searchTerm: string;
}

export const OverviewTabContentDisplay: React.FC<
  OverviewTabContentDisplayProps
> = ({
  showMapperFlag,
  csvHeaders,
  error,
  parsingErrors,
  isLoading,
  metrics,
  overviewDataMapperKey,
  TARGET_METRICS_CONFIG,
  handleMappingComplete,
  firstCsvDataRow,
  handleMappingCancel,
  savedMapping,
  handleUploadClick,
  selectedMetricsForDataView,
  aggregatedAndSortedMetrics,
  onDeleteMetric,
  totalRows,
  processedRows,
  timeGranularity,
  setTimeGranularity,
  timeRange,
  setTimeRange,
  customDateRange,
  setCustomDateRange,
  isUploading,
  isParsing,
  isProcessing,
  showKeywordPerformanceTable,
  productPerformanceData,
  productPerformanceTableColumns,
  productPerformanceRowIdAccessor,
  searchTerm,
}) => {
  if (isUploading || isParsing || isProcessing) {
    return (
      <OverviewLoadingIndicator
        isUploading={isUploading}
        isParsing={isParsing}
        isProcessing={isProcessing}
        showMapperText={showMapperFlag}
        totalRows={totalRows}
        processedRows={processedRows}
        parsingErrorCount={parsingErrors.length}
      />
    );
  }

  if (showMapperFlag && csvHeaders.length > 0) {
    return (
      <OverviewDataMapper
        key={overviewDataMapperKey}
        csvHeaders={csvHeaders}
        targetMetrics={TARGET_METRICS_CONFIG}
        onApplyMapping={handleMappingComplete}
        sampleDataRow={firstCsvDataRow}
        onCancel={handleMappingCancel}
        initialMapping={savedMapping || undefined}
      />
    );
  }

  if (
    (error || parsingErrors.length > 0) &&
    !isLoading &&
    metrics.length === 0
  ) {
    return (
      <OverviewErrorDisplay
        error={error}
        onRetryUpload={handleUploadClick}
        parsingErrors={parsingErrors}
      />
    );
  }

  if (metrics.length > 0) {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {selectedMetricsForDataView.map((metricKey) => {
            const metricConfig = TARGET_METRICS_CONFIG.find(
              (config) => config.key === metricKey,
            );
            if (!metricConfig) return null;
            const metricValue =
              metrics.length > 0
                ? metrics[metrics.length - 1][metricConfig.key]
                : null;
            return (
              <DataCard
                key={metricConfig.key}
                title={metricConfig.label}
                value={
                  metricValue !== null && typeof metricValue === 'number'
                    ? metricConfig.expectedType === 'number'
                      ? metricValue.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        })
                      : String(metricValue)
                    : 'N/A'
                }
                unit={metricKey === 'total_conversion_rate' ? '%' : undefined}
                description="Based on latest data"
                colorClass="text-blue-400"
              />
            );
          })}
        </div>
        <OverviewDataView
          metrics={metrics}
          aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
          targetMetricsConfig={TARGET_METRICS_CONFIG}
          onDeleteMetric={onDeleteMetric}
          timeGranularity={timeGranularity}
        />
      </>
    );
  }

  // Placeholder/Sample Data View
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PlaceholderChartContainer title="Sales Trends">
          <Suspense fallback={<div>Loading chart...</div>}>
            <SalesTrendsChart
              sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
              granularity="daily"
            />
          </Suspense>
        </PlaceholderChartContainer>
        <PlaceholderChartContainer title="Clicks & Impressions">
          <Suspense fallback={<div>Loading chart...</div>}>
            <ClicksImpressionsChart
              sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
              granularity="daily"
            />
          </Suspense>
        </PlaceholderChartContainer>
        <PlaceholderChartContainer title="Orders & Sessions">
          <Suspense fallback={<div>Loading chart...</div>}>
            <OrdersSessionsChart
              sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
              granularity="daily"
            />
          </Suspense>
        </PlaceholderChartContainer>
        <PlaceholderChartContainer title="Ad Spend vs. Ad Sales">
          <Suspense fallback={<div>Loading chart...</div>}>
            <AdSpendSalesChart
              sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
              granularity="daily"
            />
          </Suspense>
        </PlaceholderChartContainer>
        <PlaceholderChartContainer title="Profit Trend">
          <Suspense fallback={<div>Loading chart...</div>}>
            <ProfitTrendChart
              sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
              granularity="daily"
            />
          </Suspense>
        </PlaceholderChartContainer>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <DataCard
          title="Avg. Conversion Rate"
          value={SAMPLE_CARD_DATA.total_conversion_rate.toFixed(2)}
          unit="%"
          description="Based on latest data"
          colorClass="text-blue-400"
        />
        <DataCard
          title="Total Sales"
          value={SAMPLE_CARD_DATA.total_sales_sample.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
          })}
          description="Based on latest data"
          colorClass="text-green-400"
        />
        <DataCard
          title="Avg. Clicks"
          value={SAMPLE_CARD_DATA.avg_clicks.toFixed(1)}
          description="Based on latest data"
          colorClass="text-yellow-400"
        />
      </div>
    </>
  );
};
