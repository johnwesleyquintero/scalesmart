// src/lib/utils/amazon/data-aggregation.ts
import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  format,
} from 'date-fns';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const aggregateMetricsByTime = (
  data: DashboardMetrics[],
  granularity: TimeGranularity,
): DashboardMetrics[] => {
  if (granularity === 'daily' || !data.length) {
    return data;
  }

  const getPeriodStart = (dateStr: string): Date => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateObj;

    switch (granularity) {
      case 'weekly':
        return startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday
      case 'monthly':
        return startOfMonth(dateObj);
      case 'quarterly':
        return startOfQuarter(dateObj);
      case 'yearly':
        return startOfYear(dateObj);
      default:
        return dateObj;
    }
  };

  const aggregated = data.reduce(
    (acc, metric) => {
      const periodStartDate = getPeriodStart(metric.date);
      const periodKey = format(periodStartDate, 'yyyy-MM-dd');

      if (!acc[periodKey]) {
        acc[periodKey] = {
          ...metric,
          unique_identifier: metric.unique_identifier || 'Aggregated',
          date: periodKey,
          total_sales: 0,
          total_orders: 0,
          total_sessions: 0,
          total_page_views: 0,
          ad_impressions: 0,
          ad_clicks: 0,
          ad_spend: 0,
          ad_sales: 0,
          ad_orders: 0,
          profit: 0,
          inventory_level: 0,
          review_rating: 0,
          cac: 0,
          ltv: 0,
        };
      }

      const current = acc[periodKey];
      current.total_sales =
        (current.total_sales || 0) + (metric.total_sales || 0);
      current.total_orders =
        (current.total_orders || 0) + (metric.total_orders || 0);
      current.total_sessions =
        (current.total_sessions || 0) + (metric.total_sessions || 0);
      current.total_page_views =
        (current.total_page_views || 0) + (metric.total_page_views || 0);
      current.ad_impressions =
        (current.ad_impressions || 0) + (metric.ad_impressions || 0);
      current.ad_clicks = (current.ad_clicks || 0) + (metric.ad_clicks || 0);
      current.ad_spend = (current.ad_spend || 0) + (metric.ad_spend || 0);
      current.ad_sales = (current.ad_sales || 0) + (metric.ad_sales || 0);
      current.ad_orders = (current.ad_orders || 0) + (metric.ad_orders || 0);
      current.profit = (current.profit || 0) + (metric.profit || 0);
      current.cac = (current.cac || 0) + (metric.cac || 0);
      current.ltv = (current.ltv || 0) + (metric.ltv || 0);

      return acc;
    },
    {} as Record<string, DashboardMetrics>,
  );

  return Object.values(aggregated)
    .map((m: DashboardMetrics) => {
      const total_conversion_rate_avg =
        m.total_sessions && m.total_sessions > 0 && m.total_orders
          ? (m.total_orders / m.total_sessions) * 100
          : 0;
      const acos =
        m.ad_spend && m.ad_sales && m.ad_sales > 0
          ? (m.ad_spend / m.ad_sales) * 100
          : 0;
      const roas =
        m.ad_spend && m.ad_spend > 0 && m.ad_sales
          ? m.ad_sales / m.ad_spend
          : 0;
      const cpc =
        m.ad_spend && m.ad_clicks && m.ad_clicks > 0
          ? m.ad_spend / m.ad_clicks
          : 0;
      const ctr =
        m.ad_impressions && m.ad_impressions > 0 && m.ad_clicks
          ? (m.ad_clicks / m.ad_impressions) * 100
          : 0;
      const ad_conversion_rate =
        m.ad_clicks && m.ad_clicks > 0 && m.ad_orders
          ? (m.ad_orders / m.ad_clicks) * 100
          : 0;

      return {
        ...m,
        total_conversion_rate: parseFloat(total_conversion_rate_avg.toFixed(2)),
        acos: parseFloat(acos.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(2)),
        ad_conversion_rate: parseFloat(ad_conversion_rate.toFixed(2)),
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
