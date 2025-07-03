'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { DashboardBuilder } from './components/DashboardBuilder';
import { WidgetConfig } from './widget-types'; // Import WidgetConfig

const DashboardStudioPage = () => {
  const searchParams = useSearchParams();
  const [initialWidgets, setInitialWidgets] = useState<WidgetConfig[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  useEffect(() => {
    const widgetsParam = searchParams.get('widgets');

    if (widgetsParam) {
      try {
        const parsedWidgets: WidgetConfig[] = JSON.parse(widgetsParam);
        setInitialWidgets(parsedWidgets);
      } catch (error) {
        console.error('Failed to parse template data from URL:', error);
        // Optionally, display an error message to the user
      }
    }
    setLoadingTemplate(false);
  }, [searchParams]);

  if (loadingTemplate) {
    return <p>Loading dashboard...</p>; // Or a more sophisticated loading indicator
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Studio</h1>
      {/* Pass initial widgets and layout to DashboardBuilder */}
      <DashboardBuilder initialWidgets={initialWidgets} />
    </div>
  );
};

export default DashboardStudioPage;
