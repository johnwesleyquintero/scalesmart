import React from 'react';
import { KpiWidgetConfig } from '../widget-types';

interface KpiWidgetProps {
  config: KpiWidgetConfig;
}

export const KpiWidget: React.FC<KpiWidgetProps> = ({ config }) => {
  const { title, data } = config;

  return (
    <div className="border p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      <div className="text-4xl font-bold text-blue-600">{data.value}</div>
      <div className="text-sm text-gray-600">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-500 mt-1">{data.description}</div>
      )}
    </div>
  );
};
