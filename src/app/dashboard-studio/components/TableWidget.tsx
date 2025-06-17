import React from 'react';
import { TableWidgetConfig } from '../widget-types';

interface TableWidgetProps {
  config: TableWidgetConfig;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ config }) => {
  const { title, data } = config;
  const { headers, rows } = data;

  return (
    <div className="border p-4 rounded-lg shadow-md">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
