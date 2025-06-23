'use client';

import React, { useState, useMemo } from 'react';
import { TableWidgetConfig } from '../widget-types';

interface TableWidgetProps {
  config: TableWidgetConfig;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ config }) => {
  const { title, data } = config;
  const { headers, rows } = data;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Define items per page

  const totalPages = Math.ceil(rows.length / itemsPerPage);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return rows.slice(startIndex, endIndex);
  }, [rows, currentPage, itemsPerPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="border p-4 rounded-lg shadow-md">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      {/* TODO: Implement performance optimization strategies for rendering large datasets in tables (e.g., virtualization, pagination). */}
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
            {currentData.map((row, rowIndex) => (
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
        {rows.length === 0 && (
          <div
            className="text-center py-4 text-gray-500"
            data-testid="no-data-message"
          >
            No data available
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {rows.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      {config.conditionalFormattingRules &&
        config.conditionalFormattingRules.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Conditional Formatting Rules Applied (Placeholder)
          </div>
        )}
    </div>
  );
};
