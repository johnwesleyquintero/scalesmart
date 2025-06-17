import React from 'react';
import { FilterWidgetConfig } from '../widget-types';

interface FilterWidgetProps {
  config: FilterWidgetConfig;
  onFilterChange: (
    filterValue: string | { startDate: string; endDate: string },
  ) => void;
}

export const FilterWidget: React.FC<FilterWidgetProps> = ({
  config,
  onFilterChange,
}) => {
  const { title, data } = config;

  // This is a placeholder for different filter types
  const renderFilterControl = () => {
    switch (data.filterType) {
      case 'dropdown':
        return (
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            onChange={(e) => onFilterChange(e.target.value)}
          >
            {data.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'date-range':
        return (
          <input
            type="text" // Use a date picker library in a real app
            placeholder="Select date range"
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            onChange={(e) => {
              // This is a simplified handler for the text input
              // A real date range picker would provide start and end dates
              onFilterChange({
                startDate: e.target.value,
                endDate: e.target.value,
              });
            }}
          />
        );
      // Add other filter types like 'slider'
      default:
        return <p>Unsupported filter type: {data.filterType}</p>;
    }
  };

  return (
    <div className="border p-4 rounded-lg shadow-md">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      {renderFilterControl()}
    </div>
  );
};
