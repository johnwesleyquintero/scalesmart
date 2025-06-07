'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useCallback, useMemo, lazy, Suspense, useState } from 'react';
import { Download } from 'lucide-react';

import OverviewDataLoader from '@/components/amazon-seller-tools/overview/OverviewDataLoader';
import { OverviewTabContentDisplay } from '@/components/amazon-seller-tools/overview/OverviewTabContentDisplay';
import TableChart from '@/components/amazon-seller-tools/charts/TableChart';
import KeywordPerformanceOverviewTable from '@/components/amazon-seller-tools/KeywordPerformanceOverviewTable';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import type { CsvColumnMapping } from '@/types/data-mapping';
import type { TableChartProps } from '@/components/amazon-seller-tools/charts/TableChart';
import {
  DashboardMetrics,
  TimeRange,
  TargetMetricConfig,
  AggregatedProductMetrics,
} from '@/lib/amazon-tools/types';
import { TransformationError } from '@/lib/utils/amazon/data-transformation';
import DataCard from './DataCard';
// Import UseAmazonDataIntegrationReturn type from the hook
import type { UseAmazonDataIntegrationReturn } from '@/lib/hooks/useAmazonDataIntegration';

// Update OverviewTabProps to extend UseAmazonDataIntegrationReturn
interface OverviewTabProps extends UseAmazonDataIntegrationReturn {}

const SHOW_KEYWORD_TABLE_DEFAULT = false;

const OverviewTab: React.FC<OverviewTabProps> = (dataIntegrationData) => {
  // Destructure props from dataIntegrationData with default values to ensure type safety
  const {
    metrics = [],
    isLoading = false,
    isParsing = false,
    error = null,
    searchTerm = '',
    timeGranularity = 'daily',
    timeRange = 'custom',
    customDateRange = { from: undefined, to: undefined },
    aggregatedAndSortedMetrics = [],
    productPerformanceData = [],
    productPerformanceTableColumns = [],
    productPerformanceRowIdAccessor = () => '',
    onDeleteMetric = () => {},
    setTimeGranularity = () => {},
    setTimeRange = () => {},
    setCustomDateRange = () => {},
    onUploadFile = () => {},
    onLoadSampleData = async () => {}, // Provide default async function
    onDownloadSampleCsv = async () => {}, // Provide default async function
    fileInputRef = { current: null },
    showMapper = false,
    csvHeaders = [],
    firstCsvDataRow = undefined,
    handleMappingComplete = async () => {},
    handleMappingCancel = () => {},
    savedMapping = null,
    parsingErrors = [],
    isUploading = false,
    isMapping = false,
    isProcessing = false,
    totalRows = 0,
    processedRows = 0,
  } = dataIntegrationData;

  // The following states are still managed locally if they are specific to OverviewTab's display logic
  const [showKeywordPerformanceTable, setShowKeywordPerformanceTable] =
    useState(SHOW_KEYWORD_TABLE_DEFAULT);

  return (
    <div className="space-y-4 text-gray-900 dark:text-gray-100">
      <OverviewDataLoader
        isParsing={isParsing}
        isLoading={isLoading}
        handleUploadClick={() => fileInputRef.current?.click()} // Use the ref to trigger click
        handleFileChange={onUploadFile}
        fileInputRef={fileInputRef}
        handleLoadSampleData={onLoadSampleData}
        handleDownloadSampleCsv={onDownloadSampleCsv}
        hasMetrics={metrics.length > 0}
      />

      {metrics.length > 0 && (
        <div className="mt-4 p-4 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="time-range-select"
              className="text-gray-700 dark:text-gray-300"
            >
              Time Range:
            </Label>
            <Select
              value={timeRange}
              onValueChange={(value: TimeRange) => setTimeRange(value)}
            >
              <SelectTrigger
                id="time-range-select"
                className="w-[180px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                {timeRange === 'last_7_days' && 'Last 7 Days'}
                {timeRange === 'last_30_days' && 'Last 30 Days'}
                {timeRange === 'month_to_date' && 'Month to Date'}
                {timeRange === 'year_to_date' && 'Year to Date'}
                {timeRange === 'all_time' && 'All Time'}
                {timeRange === 'custom' && 'Custom Range'}
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                <SelectItem
                  value="last_7_days"
                  label="Last 7 Days"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Last 7 Days
                </SelectItem>
                <SelectItem
                  value="last_30_days"
                  label="Last 30 Days"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Last 30 Days
                </SelectItem>
                <SelectItem
                  value="month_to_date"
                  label="Month to Date"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Month to Date
                </SelectItem>
                <SelectItem
                  value="year_to_date"
                  label="Year to Date"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Year to Date
                </SelectItem>
                <SelectItem
                  value="all_time"
                  label="All Time"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  All Time
                </SelectItem>
                <SelectItem
                  value="custom"
                  label="Custom Range"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Custom Range
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timeRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[280px] justify-start text-left font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                      !customDateRange.from &&
                        'text-muted-foreground dark:text-gray-400',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, 'PPP')} -{' '}
                          {format(customDateRange.to, 'PPP')}
                        </>
                      ) : (
                        format(customDateRange.from, 'PPP')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  align="start"
                >
                  <Calendar
                    mode="range"
                    selected={customDateRange}
                    onSelect={(range) => {
                      if (range) {
                        setCustomDateRange({
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
                    numberOfMonths={2}
                    initialFocus
                    className="text-gray-900 dark:text-gray-100"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="time-granularity-select"
              className="text-gray-700 dark:text-gray-300"
            >
              Granularity:
            </Label>
            <Select
              value={timeGranularity}
              onValueChange={(value: string) =>
                setTimeGranularity(value as typeof timeGranularity)
              }
            >
              <SelectTrigger
                id="time-granularity-select"
                className="w-[180px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                <SelectValue placeholder="Select Time Granularity" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                <SelectItem
                  value="daily"
                  label="Daily"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Daily
                </SelectItem>
                <SelectItem
                  value="weekly"
                  label="Weekly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Weekly
                </SelectItem>
                <SelectItem
                  value="monthly"
                  label="Monthly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Monthly
                </SelectItem>
                <SelectItem
                  value="quarterly"
                  label="Quarterly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Quarterly
                </SelectItem>
                <SelectItem
                  value="yearly"
                  label="Yearly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Yearly
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <OverviewTabContentDisplay
        isUploading={isUploading}
        isParsing={isParsing}
        isProcessing={isProcessing}
        showMapperFlag={showMapper}
        csvHeaders={csvHeaders}
        error={error}
        parsingErrors={parsingErrors}
        isLoading={isLoading}
        metrics={metrics}
        overviewDataMapperKey={0} // Dummy value, not used here anymore
        TARGET_METRICS_CONFIG={[]} // Dummy value, not used here anymore
        handleMappingComplete={handleMappingComplete}
        firstCsvDataRow={firstCsvDataRow}
        handleMappingCancel={handleMappingCancel}
        savedMapping={savedMapping}
        handleUploadClick={() => fileInputRef.current?.click()}
        selectedMetricsForDataView={[]} // This state was removed, needs to be passed if used
        aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
        timeGranularity={timeGranularity}
        setTimeGranularity={setTimeGranularity}
        onDeleteMetric={onDeleteMetric}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        totalRows={totalRows}
        processedRows={processedRows}
        showKeywordPerformanceTable={showKeywordPerformanceTable}
        productPerformanceData={productPerformanceData}
        productPerformanceTableColumns={productPerformanceTableColumns}
        productPerformanceRowIdAccessor={productPerformanceRowIdAccessor}
        searchTerm={searchTerm}
      />

      <div className="mb-4 p-4 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Product Performance Overview
        </h2>
        <Suspense
          fallback={
            <div className="p-4 text-center text-gray-700 dark:text-gray-300">
              Loading table...
            </div>
          }
        >
          <TableChart
            columns={productPerformanceTableColumns}
            data={productPerformanceData}
            rowIdAccessor={productPerformanceRowIdAccessor}
          />
        </Suspense>
      </div>

      {showKeywordPerformanceTable && metrics.length > 0 && (
        <div className="mb-4 p-4 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Keyword Performance Overview
          </h2>
          <Suspense
            fallback={
              <div className="text-gray-700 dark:text-gray-300">
                Loading keyword table...
              </div>
            }
          >
            <KeywordPerformanceOverviewTable
              metrics={metrics}
              searchTerm={searchTerm}
            />
          </Suspense>
        </div>
      )}

      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium text-primary dark:text-blue-300">
            While you're here, feel free to explore the other specialized tools
            available in the tabs above!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
