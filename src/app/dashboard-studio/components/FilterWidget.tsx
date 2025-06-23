import React, { useState } from 'react';
import { FilterWidgetConfig } from '../widget-types';
import * as Slider from '@radix-ui/react-slider';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';

import 'react-day-picker/dist/style.css';

interface FilterWidgetProps {
  config: FilterWidgetConfig;
  onFilterChange: (
    filterValue: string | { startDate: Date; endDate: Date } | number,
  ) => void;
}

export const FilterWidget: React.FC<FilterWidgetProps> = ({
  config,
  onFilterChange,
}) => {
  const { title, data } = config;
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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
      case 'slider':
        return (
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-6"
            defaultValue={[0]}
            max={100}
            step={1}
            aria-label="Volume"
            onValueChange={(value) => onFilterChange(value[0])}
          >
            <Slider.Track className="relative h-0.5 w-full grow rounded-full bg-gray-400">
              <Slider.Range className="absolute h-full bg-blue-600 rounded-full" />
            </Slider.Track>
            <Slider.Thumb className="block h-4 w-4 rounded-full bg-white border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-500 disabled:cursor-not-allowed" />
          </Slider.Root>
        );
      case 'date-range':
        return (
          <DayPicker
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              setDateRange(range);
              if (range?.from && range?.to) {
                onFilterChange({
                  startDate: range.from,
                  endDate: range.to,
                });
              }
            }}
            footer={
              dateRange?.from ? (
                <p>
                  {format(dateRange.from, 'yyyy-MM-dd')} –{' '}
                  {dateRange.to
                    ? format(dateRange.to, 'yyyy-MM-dd')
                    : 'Ongoing'}
                </p>
              ) : (
                <p>Please pick a date range.</p>
              )
            }
          />
        );
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
