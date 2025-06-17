import React from 'react';

interface ChartWidgetProps {
  title: string;
  data: number[];
  labels: string[];
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  data,
  labels,
}) => {
  // This is a placeholder. In a real app, you'd use a charting library like Chart.js or Recharts.
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="bg-gray-100 h-32 flex items-center justify-center text-gray-500">
        [Chart Visualization Placeholder]
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Data: {data.join(', ')} | Labels: {labels.join(', ')}
      </div>
    </div>
  );
};
