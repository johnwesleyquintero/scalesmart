import { useState, useEffect } from 'react';
import { WidgetConfig } from '../app/dashboard-studio/widget-types';
import { Layout } from 'react-grid-layout';
import { DashboardService } from '../lib/dashboard-service';

interface DashboardData {
  widgets: WidgetConfig[];
  layout: Layout[] | null;
}

export const useDashboardData = (dashboardId: string) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboard = await DashboardService.getDashboard(dashboardId);
        if (dashboard) {
          const widgets =
            await DashboardService.getDashboardWidgets(dashboardId);
          setData({ widgets, layout: [dashboard.layout] });
        } else {
          setError('Dashboard not found');
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (dashboardId) {
      fetchDashboardData();
    }
  }, [dashboardId]);

  return { data, loading, error };
};
