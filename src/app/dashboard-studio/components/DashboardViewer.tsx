import React from 'react';

interface DashboardViewerProps {
  dashboardId: string;
}

export const DashboardViewer: React.FC<DashboardViewerProps> = ({
  dashboardId,
}) => {
  // In a real application, you would fetch dashboard data based on dashboardId
  // and render the appropriate widgets.
  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">
        Viewing Dashboard: {dashboardId}
      </h2>
      <p>This is a placeholder for the dashboard content.</p>
      {/* Render actual dashboard widgets here based on fetched data */}
    </div>
  );
};
