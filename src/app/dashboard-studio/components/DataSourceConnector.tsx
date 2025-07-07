import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const DataSourceConnector = () => {
  const [sourceType, setSourceType] = useState('');
  const [connectionString, setConnectionString] = useState('');

  const handleConnect = () => {
    console.log(`Connecting to ${sourceType} with: ${connectionString}`);
    // Logic to connect to data source
    alert('Attempting to connect to data source (check console)');
  };

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Data Source Connector</h2>
      <div className="mb-4">
        <label
          htmlFor="sourceType"
          className="block text-sm font-medium text-gray-700"
        >
          Source Type
        </label>
        <select
          id="sourceType"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
        >
          <option value="">Select a source type</option>
          <option value="database">Database</option>
          <option value="api">API</option>
          <option value="spreadsheet">Spreadsheet</option>
        </select>
      </div>
      <div className="mb-4">
        <label
          htmlFor="connectionString"
          className="block text-sm font-medium text-gray-700"
        >
          Connection String/Details
        </label>
        <input
          type="text"
          id="connectionString"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="e.g., jdbc:mysql://localhost:3306/mydb or API Endpoint"
        />
      </div>
      <Button onClick={handleConnect}>Connect</Button>
    </div>
  );
};
