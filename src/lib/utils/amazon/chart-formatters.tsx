import React from 'react'; // React import is necessary for JSX
import { format, formatDistanceToNow } from 'date-fns';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

export const formatTick = (
  tick: string | number | Date,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
) => {
  if (typeof tick === 'number') {
    return tick.toString();
  }

  let dateObj: Date;
  if (typeof tick === 'string') {
    dateObj = new Date(tick);
  } else {
    // tick is a Date object
    dateObj = tick;
  }

  if (isNaN(dateObj.getTime())) {
    return typeof tick === 'string' ? tick : 'Invalid Date';
  }

  const dailyDateFormat = 'MMM dd';
  const monthlyDateFormat = 'MMM yyyy';
  const quarterlyDateFormat = 'QQQ yyyy';
  const yearlyDateFormat = 'yyyy';

  switch (granularity) {
    case 'daily':
      return format(dateObj, dailyDateFormat);
    case 'weekly':
      return format(dateObj, dailyDateFormat);
    case 'monthly':
      return format(dateObj, monthlyDateFormat);
    case 'quarterly':
      return format(dateObj, quarterlyDateFormat);
    case 'yearly':
      return format(dateObj, yearlyDateFormat);
    default:
      // Fallback for a valid date with an unexpected granularity
      return format(dateObj, dailyDateFormat);
  }
};

export const formatTooltipLabel = (
  label: string | number | Date,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
) => {
  if (typeof label === 'number') {
    return label.toString();
  }

  let dateObj: Date;
  if (typeof label === 'string') {
    dateObj = new Date(label);
  } else {
    // label is a Date object
    dateObj = label;
  }

  if (isNaN(dateObj.getTime())) {
    return typeof label === 'string' ? label : 'Invalid Date';
  }

  const dailyDateFormat = 'MMM dd, yyyy';
  switch (granularity) {
    case 'daily':
      return format(dateObj, dailyDateFormat);
    case 'weekly':
      return `Week of ${format(dateObj, dailyDateFormat)}`;
    case 'monthly':
      return format(dateObj, 'MMMM yyyy');
    case 'quarterly':
      return format(dateObj, 'QQQ yyyy'); // QQQ is e.g. Q1, Q2
    case 'yearly':
      return format(dateObj, 'yyyy');
    default:
      // Fallback for a valid date with an unexpected granularity
      return format(dateObj, dailyDateFormat);
  }
};

export const enhancedTooltipFormatter = (
  value: number | undefined,
  name: string,
  dataPoint: DashboardMetrics,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  sortedMetrics: DashboardMetrics[],
): React.ReactNode => {
  const formattedValue = (value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const previousDataPoint = findPreviousDataPoint(
    dataPoint,
    granularity,
    sortedMetrics,
  );
  const previousValue = Number(previousDataPoint?.[name] ?? 0);
  const difference = (value ?? 0) - previousValue;
  const percentageChange =
    previousValue === 0 ? 0 : (difference / previousValue) * 100;
  const changeIndicator = difference >= 0 ? '▲' : '▼'; // Up/down arrow
  const changeColor = difference >= 0 ? 'text-green-500' : 'text-red-500'; // Color for change

  const formattedPreviousValue = previousValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedDifference = Math.abs(difference).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedPercentage = percentageChange.toFixed(1);

  return (
    <div className="flex flex-col text-sm">
      <div className="font-bold">{name}</div>
      <div>Current: {formattedValue}</div>
      {previousDataPoint && <div>Previous: {formattedPreviousValue}</div>}
      {previousDataPoint && (
        <div className={changeColor}>
          Change: {changeIndicator} {formattedDifference} ({formattedPercentage}
          %)
        </div>
      )}
    </div>
  );
};

const findPreviousDataPoint = (
  dataPoint: DashboardMetrics,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  sortedMetrics: DashboardMetrics[],
): DashboardMetrics | undefined => {
  const currentDataPointDate = new Date(dataPoint.date);
  if (isNaN(currentDataPointDate.getTime())) {
    return undefined; // Cannot find previous if current date is invalid
  }
  const currentDataPointTime = currentDataPointDate.getTime();

  let foundIndex = -1;
  for (let i = 0; i < sortedMetrics.length; i++) {
    const metric = sortedMetrics[i];
    if (metric && metric.date) {
      const metricDate = new Date(metric.date);
      if (
        !isNaN(metricDate.getTime()) &&
        metricDate.getTime() === currentDataPointTime
      ) {
        foundIndex = i;
        break;
      }
    }
  }

  if (foundIndex > 0) {
    return sortedMetrics[foundIndex - 1];
  }

  return undefined;
  // Note: The 'granularity' parameter is currently unused in this function.
};
