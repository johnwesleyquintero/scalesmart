'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAmazonDataIntegration } from '@/lib/hooks/useAmazonDataIntegration'; // Import the new hook
import type { UseAmazonDataIntegrationReturn } from '@/lib/hooks/useAmazonDataIntegration'; // Import the return type interface from the hook

/**
 * `DataIntegrationTab` is responsible for handling all data loading, parsing,
 * transformation, and state management for the Amazon Seller Tools dashboard.
 * It acts as the exclusive data source, providing processed metrics and
 * related states/callbacks to its parent component.
 *
 * @returns {JSX.Element} The Data Integration tab content, including data upload/mapping UI.
 */
const DataIntegrationTab: React.FC<{
  onDataUpdate: (data: UseAmazonDataIntegrationReturn) => void;
}> = ({ onDataUpdate }) => {
  const data = useAmazonDataIntegration();

  // Effect to notify parent of data updates
  useEffect(() => {
    onDataUpdate(data);
  }, [data, onDataUpdate]);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Data Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This section is now the central hub for all Amazon Seller Tools data.
          Upload your CSV files, map columns, and manage your data sources here.
        </p>
        <div className="border-dashed border-2 border-gray-300 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400 rounded-lg">
          <p className="mb-2">Data integration features are now active!</p>
          <p>Use the controls below to upload new data or load sample data.</p>
        </div>
        {/* Placeholder for data upload/mapping UI - will be implemented in a later step */}
        <div className="mt-4">
          {/* This is where the data upload/mapping UI will eventually go */}
          <p className="text-gray-700 dark:text-gray-300">
            Data upload and mapping controls will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataIntegrationTab;
