import React from 'react';
import { useRouter } from 'next/router';
import { DashboardViewer } from '../components/DashboardViewer';

const IndividualDashboardPage = () => {
  // In Next.js App Router, dynamic segments are accessed via props.params
  // This is a placeholder for how you might access the dashboardId
  // For actual implementation, you'd receive `params` as a prop to the component
  // For example: `const IndividualDashboardPage = ({ params }: { params: { dashboardId: string } }) => {`
  const dashboardId = 'example-dashboard-id'; // Replace with actual dynamic segment access

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard: {dashboardId}</h1>
      <DashboardViewer dashboardId={dashboardId} />
    </div>
  );
};

export default IndividualDashboardPage;
