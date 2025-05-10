/**
 * Utility functions for exporting data to CSV format
 */

import Papa from 'papaparse';

/**
 * Export data to CSV file and trigger download
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  // Create CSV content
  const csv = Papa.unparse(data);

  // Create a blob and download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
