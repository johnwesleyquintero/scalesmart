'use client';
import React, { useState } from 'react';

export const DashboardBuilder = () => {
  const [widgets, setWidgets] = useState<string[]>([]);

  const addWidget = (type: string) => {
    setWidgets([...widgets, type]);
  };

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Build Your Dashboard</h2>
      <div className="mb-4">
        <button
          onClick={() => addWidget('Chart')}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Add Chart Widget
        </button>
        <button
          onClick={() => addWidget('Table')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Table Widget
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget, index) => (
          <div key={index} className="border p-4 rounded shadow">
            {widget} Widget Placeholder
          </div>
        ))}
      </div>
    </div>
  );
};
