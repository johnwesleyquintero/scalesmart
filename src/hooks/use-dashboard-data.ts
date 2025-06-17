import { useState, useEffect } from 'react';
import { WidgetConfig } from '../app/dashboard-studio/widget-types';
import { Layout } from 'react-grid-layout';

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
        // Simulate API call
        const response = await new Promise<DashboardData>((resolve) =>
          setTimeout(() => {
            resolve({
              widgets: [
                {
                  id: 'chart1',
                  type: 'chart',
                  title: 'Sales by Month',
                  data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                      { label: 'Sales', data: [10, 20, 15, 25, 22, 30] },
                    ],
                  },
                  chartType: 'bar', // Added missing property
                  x: 0, // Added missing property
                  y: 0, // Added missing property
                  w: 6, // Added missing property
                  h: 4, // Added missing property
                },
                {
                  id: 'table1',
                  type: 'table',
                  title: 'Top Products',
                  data: {
                    headers: ['Product', 'Sales', 'Units'],
                    rows: [
                      ['A', '1000', '100'],
                      ['B', '800', '80'],
                    ],
                  },
                  x: 0, // Added missing property
                  y: 4, // Added missing property (adjusting y to avoid overlap)
                  w: 6, // Added missing property
                  h: 4, // Added missing property
                },
              ],
              layout: [],
            });
          }, 1000),
        );
        setData(response);
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
