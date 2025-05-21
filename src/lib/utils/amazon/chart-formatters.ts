// src/lib/utils/amazon/chart-formatters.ts
import { format, addDays } from 'date-fns';

type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const formatTick = (
  tick: string,
  granularity: TimeGranularity,
): string => {
  const date = new Date(tick);
  if (isNaN(date.getTime())) return tick; // Return original if date is invalid

  if (granularity === 'daily') return format(date, 'MMM d');
  if (granularity === 'weekly') return `W/o ${format(date, 'MMM d')}`;
  if (granularity === 'monthly') return format(date, 'MMM yyyy');
  if (granularity === 'quarterly') {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${format(date, 'yyyy')}`;
  }
  if (granularity === 'yearly') return format(date, 'yyyy');
  return tick;
};

export const formatTooltipLabel = (
  label: string,
  granularity: TimeGranularity,
): string => {
  const DATE_FORMAT_TOOLTIP_DEFAULT = 'MMM d, yyyy';
  const date = new Date(label);
  if (isNaN(date.getTime())) return label; // Return original if date is invalid

  if (granularity === 'weekly') {
    const endDate = addDays(date, 6);
    return `${format(date, DATE_FORMAT_TOOLTIP_DEFAULT)} - ${format(endDate, DATE_FORMAT_TOOLTIP_DEFAULT)}`;
  }
  return format(date, DATE_FORMAT_TOOLTIP_DEFAULT);
};
