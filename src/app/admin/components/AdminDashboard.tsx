import React from 'react';
import DashboardCard from './DashboardCard';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 1. Key Performance Indicators (KPIs) and Analytics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Key Performance Indicators & Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard title="User Statistics">
            <p>
              Active users: <strong>1,234</strong>
            </p>
            <p>
              New registrations (last 30 days): <strong>120</strong>
            </p>
            <p>
              Demographics: <em>(Chart placeholder)</em>
            </p>
          </DashboardCard>
          <DashboardCard title="System Health">
            <p>
              Server Load: <strong>25%</strong>
            </p>
            <p>
              API Response Times: <strong>150ms</strong>
            </p>
            <p>
              Error Rates: <strong>0.1%</strong>
            </p>
          </DashboardCard>
          <DashboardCard title="Feature Usage">
            <p>
              Most used feature: <strong>Project Management</strong>
            </p>
            <p>
              Least used feature: <strong>Markdown Notepad</strong>
            </p>
          </DashboardCard>
          <DashboardCard title="Revenue/Subscription Data">
            <p>
              Monthly Recurring Revenue: <strong>$15,000</strong>
            </p>
            <p>
              New Subscriptions: <strong>15</strong>
            </p>
            <p>
              Churn Rate: <strong>2%</strong>
            </p>
          </DashboardCard>
        </div>
      </section>

      {/* 2. User Management */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <DashboardCard title="User List">
          <p>
            <em>(Table placeholder for user list with search/filter)</em>
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>
              John Doe - Admin{' '}
              <button className="ml-2 text-blue-500">Edit</button>{' '}
              <button className="text-red-500">Suspend</button>
            </li>
            <li>
              Jane Smith - User{' '}
              <button className="ml-2 text-blue-500">Edit</button>{' '}
              <button className="text-red-500">Suspend</button>
            </li>
          </ul>
        </DashboardCard>
      </section>

      {/* 3. Content Management (if applicable) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Content Management</h2>
        <DashboardCard title="Blog/Docs Editor">
          <p>Manage articles and documentation.</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Go to Content Editor
          </button>
        </DashboardCard>
      </section>

      {/* 4. System Configuration */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">System Configuration</h2>
        <DashboardCard title="Settings">
          <p>Manage application-wide settings and feature flags.</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Go to Settings
          </button>
        </DashboardCard>
      </section>

      {/* 5. Activity Logs and Auditing */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Activity Logs & Auditing
        </h2>
        <DashboardCard title="Recent Actions">
          <p>
            <em>(Log display placeholder)</em>
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Admin John Doe updated user profile (1 hour ago)</li>
            <li>System alert: High server load (30 mins ago)</li>
          </ul>
        </DashboardCard>
      </section>

      {/* 6. Reporting */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reporting</h2>
        <DashboardCard title="Custom Reports">
          <p>Generate reports based on various data points.</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Generate Report
          </button>
        </DashboardCard>
      </section>

      {/* 7. Notifications and Alerts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Notifications & Alerts</h2>
        <DashboardCard title="System Alerts">
          <p>Critical system issues or anomalies.</p>
          <ul className="list-disc list-inside mt-2">
            <li>Database connection error (Critical)</li>
            <li>New user feedback received</li>
          </ul>
        </DashboardCard>
      </section>
    </div>
  );
};

export default AdminDashboard;
