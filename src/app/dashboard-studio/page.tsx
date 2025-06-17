import React from 'react';
import { DashboardBuilder } from './components/DashboardBuilder';

const DashboardStudioPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Studio</h1>
      <DashboardBuilder />
    </div>
  );
};

export default DashboardStudioPage;
