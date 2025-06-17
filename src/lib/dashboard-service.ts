interface Dashboard {
  id: string;
  name: string;
  widgets: any[]; // Define a more specific type for widgets
  layout: any; // Define a more specific type for layout
}

export const DashboardService = {
  async getDashboard(id: string): Promise<Dashboard | null> {
    // Simulate API call to fetch a dashboard
    return new Promise((resolve) => {
      setTimeout(() => {
        if (id === 'example-dashboard-id') {
          resolve({
            id: 'example-dashboard-id',
            name: 'My Example Dashboard',
            widgets: [],
            layout: {},
          });
        } else {
          resolve(null);
        }
      }, 500);
    });
  },

  async saveDashboard(dashboard: Dashboard): Promise<Dashboard> {
    // Simulate API call to save a dashboard
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Saving dashboard:', dashboard);
        resolve(dashboard);
      }, 500);
    });
  },

  async createDashboard(name: string): Promise<Dashboard> {
    // Simulate API call to create a new dashboard
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDashboard: Dashboard = {
          id: `dashboard-${Date.now()}`,
          name,
          widgets: [],
          layout: {},
        };
        console.log('Creating new dashboard:', newDashboard);
        resolve(newDashboard);
      }, 500);
    });
  },
};
