/**
 * Utility functions for exporting data to CSV format
 */

import Papa from 'papaparse';

/**
 * Export data to CSV file and trigger download
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
type ExportData = {
  [key: string]: string | number | boolean | null | undefined;
};

export function exportToCSV(data: ExportData[], filename: string) {
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
