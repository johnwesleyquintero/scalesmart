'use client';

import React from 'react';
import { TableWidgetConfig } from '../widget-types';
import { FixedSizeList as List } from 'react-window';

interface TableWidgetProps {
  config: TableWidgetConfig;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ config }) => {
  const { title, data } = config;
  const { headers, rows } = data;

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => (
    <div style={style} className="flex border-b">
      {rows[index].map((cell, cellIndex) => (
        <div
          key={cellIndex}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex-1"
        >
          {cell}
        </div>
      ))}
    </div>
  );

  return (
    <div className="border p-4 rounded-lg shadow-md">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="bg-gray-50 flex">
            {headers.map((header, index) => (
              <div
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1"
              >
                {header}
              </div>
            ))}
          </div>
          {rows.length > 0 ? (
            <List
              height={400}
              itemCount={rows.length}
              itemSize={50}
              width="100%"
            >
              {Row}
            </List>
          ) : (
            <div
              className="text-center py-4 text-gray-500"
              data-testid="no-data-message"
            >
              No data available
            </div>
          )}
        </div>
      </div>
      {config.conditionalFormattingRules &&
        config.conditionalFormattingRules.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Conditional Formatting Rules Applied (Placeholder)
          </div>
        )}
    </div>
  );
};
