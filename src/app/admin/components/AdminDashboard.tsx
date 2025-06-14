import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 1. Key Performance Indicators (KPIs) and Analytics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Key Performance Indicators & Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">User Statistics</h3>
            <p>
              Active users: <strong>1,234</strong>
            </p>
            <p>
              New registrations (last 30 days): <strong>120</strong>
            </p>
            <p>
              Demographics: <em>(Chart placeholder)</em>
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">System Health</h3>
            <p>
              Server Load: <strong>25%</strong>
            </p>
            <p>
              API Response Times: <strong>150ms</strong>
            </p>
            <p>
              Error Rates: <strong>0.1%</strong>
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">Feature Usage</h3>
            <p>
              Most used feature: <strong>Project Management</strong>
            </p>
            <p>
              Least used feature: <strong>Markdown Notepad</strong>
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">
              Revenue/Subscription Data
            </h3>
            <p>
              Monthly Recurring Revenue: <strong>$15,000</strong>
            </p>
            <p>
              New Subscriptions: <strong>15</strong>
            </p>
            <p>
              Churn Rate: <strong>2%</strong>
            </p>
          </div>
        </div>
      </section>

      {/* 2. User Management */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">User List</h3>
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
        </div>
      </section>

      {/* 3. Content Management (if applicable) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Content Management</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">Blog/Docs Editor</h3>
          <p>Manage articles and documentation.</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Go to Content Editor
          </button>
        </div>
      </section>

      {/* 4. System Configuration */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">System Configuration</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">Settings</h3>
          <p>Manage application-wide settings and feature flags.</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Go to Settings
          </button>
        </div>
      </section>

      {/* 5. Activity Logs and Auditing */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Activity Logs & Auditing
        </h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">Recent Actions</h3>
          <p>
            <em>(Log display placeholder)</em>
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Admin John Doe updated user profile (1 hour ago)</li>
            <li>System alert: High server load (30 mins ago)</li>
          </ul>
        </div>
      </section>

      {/* 6. Reporting */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reporting</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">Custom Reports</h3>
          <p>Generate reports based on various data points.</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Generate Report
          </button>
        </div>
      </section>

      {/* 7. Notifications and Alerts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Notifications & Alerts</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">System Alerts</h3>
          <p>Critical system issues or anomalies.</p>
          <ul className="list-disc list-inside mt-2">
            <li>Database connection error (Critical)</li>
            <li>New user feedback received</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
