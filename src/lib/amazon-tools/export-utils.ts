/**
 * Utility functions for exporting data to CSV format
 */

import Papa from 'papaparse';

/**
 * Export data to CSV file and trigger download
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
/**
 * Defines the structure for data records that can be exported to CSV.
 * It's a generic object where keys are strings and values can be various primitive types or null/undefined.
 */
type ExportData = {
  [key: string]: string | number | boolean | null | undefined;
};

/**
 * Exports an array of data objects to a CSV file and triggers a download in the browser.
 * This utility is designed for client-side use as it relies on the `document` object.
 * @param data - An array of objects, where each object represents a row in the CSV.
 *               The keys of the objects will become the CSV headers.
 * @param filename - The desired name for the downloaded CSV file (e.g., "my_report").
 *                   The function will automatically ensure a ".csv" extension.
 */
export function exportToCSV(data: ExportData[], filename: string) {
  // Generate CSV content from the array of objects
  const csv = Papa.unparse(data);

  // Ensure the filename has a .csv extension
  const finalFilename = filename.endsWith('.csv')
    ? filename
    : `${filename}.csv`;

  // Create a Blob containing the CSV content with the correct MIME type
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename); // Set the download filename

  // Append the link to the document body, click it, and then remove it
  // This sequence is necessary to programmatically trigger a download.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke the object URL to free up memory
  URL.revokeObjectURL(url);
}
