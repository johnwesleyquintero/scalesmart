// src/lib/utils/formatting.ts
import React from 'react';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

export const formatCurrencyValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return 'N/A';
};

export const formatPercentageValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return `${value.toFixed(2)}%`;
  }
  return 'N/A';
};

export const formatDateValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleDateString();
    } catch {
      return value;
    }
  }
  return value != null ? String(value) : 'N/A';
};

export const formatDefaultValue = (value: unknown): React.ReactNode => {
  return value != null ? String(value) : 'N/A';
};

export const getCellFormatter = (
  metricKey: keyof DashboardMetrics,
): ((val: unknown) => React.ReactNode) => {
  switch (metricKey) {
    case 'total_sales':
    case 'ad_spend':
    case 'ad_sales':
    case 'profit':
      return formatCurrencyValue;
    case 'total_conversion_rate':
    case 'acos':
    case 'roas':
      return formatPercentageValue;
    case 'date':
      return formatDateValue;
    default:
      if (typeof metricKey === 'string' && metricKey.includes('date')) {
        return formatDateValue;
      }
      return formatDefaultValue;
  }
};
