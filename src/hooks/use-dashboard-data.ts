import { useState, useEffect } from 'react';

interface DashboardData {
  // Define your dashboard data structure here
  widgets: any[];
  layout: any;
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
                  data: [10, 20, 15, 25, 22, 30],
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                },
                {
                  id: 'table1',
                  type: 'table',
                  title: 'Top Products',
                  headers: ['Product', 'Sales', 'Units'],
                  rows: [
                    ['A', '1000', '100'],
                    ['B', '800', '80'],
                  ],
                },
              ],
              layout: {},
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
