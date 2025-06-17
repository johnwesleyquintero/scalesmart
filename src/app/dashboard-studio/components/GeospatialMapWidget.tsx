import React from 'react';
import { BaseWidgetConfig } from '../widget-types';

interface GeospatialMapWidgetProps {
  config: BaseWidgetConfig; // Use BaseWidgetConfig for now, refine later
}

export const GeospatialMapWidget: React.FC<GeospatialMapWidgetProps> = ({
  config,
}) => {
  const { title } = config;

  return (
    <div className="border p-4 rounded-lg shadow-md h-full flex flex-col">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      <div className="flex-grow bg-gray-100 flex items-center justify-center text-gray-500">
        [Geospatial Map Visualization Placeholder]
      </div>
    </div>
  );
};
