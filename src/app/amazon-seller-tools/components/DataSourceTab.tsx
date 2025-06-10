// src/app/amazon-seller-tools/components/DataSourceTab.tsx
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { Badge } from '@/components/ui/badge'; // Import Badge component
import Papa from 'papaparse'; // Import PapaParse
import {
  addAmazonReport,
  getAllAmazonReports,
  updateAmazonReport,
} from '@/lib/indexeddb/amazon-tools-db'; // Import IndexedDB functions
import { AmazonReport } from '@/types/indexeddb'; // Import AmazonReport type
import { useEffect } from 'react'; // Import useEffect

interface DataSourceTabProps {
  // Define props needed for this component, e.g., onFileUpload
  onFileUpload?: (files: File[], parsedData: Record<string, unknown>[]) => void; // Updated prop to include parsed data
}

const DataSourceTab: React.FC<DataSourceTabProps> = ({ onFileUpload }) => {
  // Define a type for files with category information, including an optional ID for IndexedDB
  interface UploadedFile extends File {
    id?: string; // Added for IndexedDB key
    category?: string;
  }

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // State to store uploaded files with category
  // Define a type for the parsed data stored in state
  interface ParsedFileData {
    fileName: string;
    data: Record<string, unknown>[];
  }

  const [parsedData, setParsedData] = useState<ParsedFileData[]>([]); // State to store parsed data with file name

  // Load existing reports from IndexedDB on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        const reports = await getAllAmazonReports();
        const filesFromReports: UploadedFile[] = reports.map((report) => {
          // Reconstruct a File-like object for display
          const file = new File([], report.fileName, {
            type: 'text/csv',
            lastModified: report.uploadDate,
          });
          return {
            ...file,
            id: report.id,
            category: report.category,
          };
        });
        setUploadedFiles(filesFromReports);
        setParsedData(
          reports.map((report) => ({
            fileName: report.fileName,
            data: report.parsedData,
          })),
        );
      } catch (error) {
        console.error('Failed to load Amazon reports from IndexedDB:', error);
      }
    };
    loadReports();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
        ...file,
        category: '', // Initialize category as empty string
      }));
      setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]); // Add new files to state

      newFiles.forEach((file) => {
        Papa.parse(file, {
          header: true, // Assuming the first row is headers
          skipEmptyLines: true,
          complete: async (results) => {
            console.log('Parsed data for', file.name, results.data); // Log parsed data
            const report: AmazonReport = {
              fileName: file.name,
              category: '', // Initial category
              uploadDate: Date.now(),
              parsedData: results.data as Record<string, unknown>[], // Cast parsed data to the expected type
            };
            try {
              const id = await addAmazonReport(report); // Save to IndexedDB
              setUploadedFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f === file ? { ...f, id: id as string } : f,
                ),
              );
              setParsedData((prevData) => [
                ...prevData,
                {
                  fileName: file.name,
                  data: results.data as Record<string, unknown>[],
                },
              ]); // Store parsed data with file name
              if (onFileUpload) {
                onFileUpload([file], results.data as Record<string, unknown>[]); // Cast when passing to prop
              }
            } catch (dbError) {
              console.error('Error saving report to IndexedDB:', dbError);
            }
          },
          error: (error) => {
            console.error('Error parsing file', file.name, error);
            // Handle parsing errors, maybe update UI to show error for the file
          },
        });
      });

      // Clear the input value so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const handleCategoryChange = async (index: number, category: string) => {
    const updatedFiles = uploadedFiles.map((file, i) =>
      i === index ? { ...file, category } : file,
    );
    setUploadedFiles(updatedFiles);

    const fileToUpdate = updatedFiles[index];
    if (fileToUpdate.id) {
      const reportToUpdate: AmazonReport = {
        id: fileToUpdate.id,
        fileName: fileToUpdate.name,
        category: category,
        uploadDate: fileToUpdate.lastModified, // Use existing timestamp
        parsedData:
          parsedData.find((data) => data.fileName === fileToUpdate.name)
            ?.data || [], // Access the 'data' property
      };
      try {
        await updateAmazonReport(reportToUpdate);
        console.log(
          `Report ${fileToUpdate.name} category updated to ${category} in IndexedDB.`,
        );
      } catch (error) {
        console.error(
          `Failed to update category for ${fileToUpdate.name} in IndexedDB:`,
          error,
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="mb-4">
          Upload your Amazon reports (CSV, Google Sheets) here for analysis.
        </p>
        <div className="grid w-full max-w-sm items-center gap-1.5 mb-6">
          {' '}
          {/* Added mb-6 for spacing */}
          <Label htmlFor="report-upload">Upload Reports</Label>
          <Input
            id="report-upload"
            type="file"
            multiple
            accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" // Accept CSV and common spreadsheet formats
            onChange={handleFileChange}
          />
        </div>

        {/* Display list of uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Uploaded Files</h3>
            {uploadedFiles.map((file, index) => (
              <Card key={index}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{file.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                    Size: {(file.size / 1024).toFixed(2)} KB | Type:{' '}
                    {file.type || 'N/A'}
                  </p>
                  {/* Category Input */}
                  <div className="flex items-center gap-2 mb-2">
                    {' '}
                    {/* Added mb-2 for spacing */}
                    <Label htmlFor={`category-${index}`} className="shrink-0">
                      Category:
                    </Label>
                    <Input
                      id={`category-${index}`}
                      type="text"
                      value={file.category || ''} // Use file.category
                      onChange={(e) =>
                        handleCategoryChange(index, e.target.value)
                      }
                      placeholder="e.g., Search Term Report"
                      className="flex-grow" // Allow input to grow
                    />
                  </div>
                  {/* Optional: Display a summary of parsed data, e.g., number of rows */}
                  {parsedData.find((data) => data.fileName === file.name)
                    ?.data &&
                    parsedData.find((data) => data.fileName === file.name)!.data
                      .length > 0 && ( // Safely access data and length
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                        Parsed Rows:{' '}
                        {
                          parsedData.find(
                            (data) => data.fileName === file.name,
                          )!.data.length
                        }{' '}
                        {/* Safely access data and length */}
                      </p>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceTab;
