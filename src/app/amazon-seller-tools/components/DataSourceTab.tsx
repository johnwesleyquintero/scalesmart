// src/app/amazon-seller-tools/components/DataSourceTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as PapaParse from 'papaparse';
import {
  addAmazonReport,
  getAllAmazonReports,
  updateAmazonReport,
} from '@/lib/indexeddb/amazon-tools-db';
import { AmazonReport } from '@/types/indexeddb';
import {
  ProductResearchData,
  KeywordTrackingData,
  ListingOptimizationData,
  AnalyticsData,
  ParsedFileData,
} from '@/types/amazon-tools';

import { transformCsvData } from '@/lib/utils/csv-transformer';
import { CsvColumnMapping } from '@/types/data-mapping';
import { CsvTransformerConfig } from '@/types/csv-transformer-config';
import { getReportConfig } from '@/lib/amazon-tools/reportProcessing';

const PRODUCT_RESEARCH = 'product-research';
const KEYWORD_TRACKING = 'keyword-tracking';
const LISTING_OPTIMIZATION = 'listing-optimization';
const ANALYTICS = 'analytics';

type DataType =
  | ProductResearchData
  | KeywordTrackingData
  | ListingOptimizationData
  | AnalyticsData;

interface DataSourceTabProps {
  currentTab: string;
  onFileUpload?: (files: File[], parsedData: DataType[]) => void;
}

interface UploadedFile extends File {
  id?: string;
  category: string;
}

const transformParsedData = (
  rawParsedData: Record<string, unknown>[],
  category: string,
  fileName: string,
): DataType[] | Record<string, unknown>[] => {
  const config = getReportConfig(category);

  if (!config) {
    console.warn(
      `No specific transformation defined or found for category: ${category}`,
    );
    return rawParsedData as Record<string, unknown>[]; // Return raw data if no transformation is defined or found
  }

  try {
    // Use the generic transformCsvData function
    // transformCsvData uses aliases in config to find columns, no separate mapping needed
    const transformed = transformCsvData(
      rawParsedData,
      {} as CsvColumnMapping,
      config,
    ); // Pass empty mapping as it's not used by transformCsvData with aliases
    console.log(
      `Data transformed for category: ${category}, file: ${fileName}`,
    );
    return transformed as unknown as DataType[];
  } catch (error) {
    console.error(
      `Error transforming data for category ${category}, file ${fileName}:`,
      error,
    );
    // Return raw data or an empty array in case of transformation error
    return rawParsedData as Record<string, unknown>[];
  }
};

const DataSourceTab = ({ currentTab, onFileUpload }: DataSourceTabProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parsedData, setParsedData] = useState<ParsedFileData<DataType>[]>([]);
  const [spApiStatus, setSpApiStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [spApiError, setSpApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const reports = await getAllAmazonReports();
        console.log('Reports from IndexedDB:', reports);
        const filesFromReports: UploadedFile[] = reports.map((report) => {
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
            data: report.parsedData as DataType[],
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
      const filesArray = Array.from(files); // Original File objects

      const newUploadedFiles: UploadedFile[] = filesArray.map((file) => ({
        ...file,
        category: PRODUCT_RESEARCH, // Default category
      }));
      setUploadedFiles((prevFiles) => [...prevFiles, ...newUploadedFiles]);

      filesArray.forEach((originalFile, index) => {
        // Iterate over original files
        const uploadedFileMeta = newUploadedFiles[index]; // Get the metadata for this file
        console.log('Parsing file:', originalFile.name, originalFile); // Log original file object

        const parseConfig: PapaParse.ParseLocalConfig<
          Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
          File
        > = {
          header: true,
          skipEmptyLines: true,
          complete: async (
            results: PapaParse.ParseResult<Record<string, any>>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ) => {
            console.log(
              'Parsing complete for',
              originalFile.name,
              'Results:',
              results,
            );

            const rawParsedData: Record<string, unknown>[] = results.data;

            const transformedData = transformParsedData(
              rawParsedData,
              uploadedFileMeta.category, // Use category from metadata
              originalFile.name,
            );

            const report: AmazonReport = {
              fileName: originalFile.name,
              category: uploadedFileMeta.category, // Use category from metadata
              uploadDate: Date.now(),
              parsedData: transformedData as DataType[],
            };
            try {
              const id = await addAmazonReport(report);
              setUploadedFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.name === originalFile.name &&
                  f.category === uploadedFileMeta.category // Match by name and category
                    ? { ...f, id: id as string }
                    : f,
                ),
              );
              setParsedData((prevData: ParsedFileData<DataType>[]) => [
                ...prevData,
                {
                  fileName: originalFile.name,
                  data: transformedData as DataType[],
                },
              ]);
              if (onFileUpload) {
                onFileUpload([originalFile], transformedData as DataType[]);
              }
            } catch (dbError) {
              console.error('Error saving report to IndexedDB:', dbError);
            }
          },
          error: (error: Error, file: File) => {
            console.error('Error parsing file', file.name, error);
          },
        };
        PapaParse.parse(originalFile, parseConfig); // Pass original file
      });

      event.target.value = '';
    }
  };

  const handleCategoryChange = async (index: number, category: string) => {
    const updatedFiles = uploadedFiles.map((file: UploadedFile, i: number) =>
      i === index ? { ...file, category } : file,
    );
    setUploadedFiles(updatedFiles);

    const fileToUpdate = updatedFiles[index];
    if (fileToUpdate.id) {
      const reportToUpdate: AmazonReport = {
        id: fileToUpdate.id,
        fileName: fileToUpdate.name,
        category: category,
        uploadDate: fileToUpdate.lastModified,
        parsedData:
          parsedData.find((data) => data.fileName === fileToUpdate.name)
            ?.data || [],
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
          <Label htmlFor="report-upload">Upload Reports</Label>
          <Input
            id="report-upload"
            type="file"
            multiple
            accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
          />
        </div>

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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor={`category-${index}`} className="shrink-0">
                      Category:
                    </Label>
                    <Input
                      id={`category-${index}`}
                      type="text"
                      value={file.category || ''}
                      onChange={(e) =>
                        handleCategoryChange(index, e.target.value)
                      }
                      placeholder="e.g., Search Term Report"
                      className="flex-grow"
                    />
                  </div>
                  {parsedData.find((data) => data.fileName === file.name)
                    ?.data &&
                    parsedData.find((data) => data.fileName === file.name)!.data
                      .length > 0 && (
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                        Parsed Rows:{' '}
                        {
                          parsedData.find(
                            (data) => data.fileName === file.name,
                          )!.data.length
                        }
                      </p>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New section for SP-API Integration */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md mt-4">
        <h3 className="text-xl font-semibold mb-4">
          Amazon SP-API Integration
        </h3>
        <p className="mb-4">
          Connect your Amazon Seller Central account via SP-API for automated
          data fetching.
        </p>
        {/* TODO: Implement actual SP-API connection logic */}
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={async () => {
            setSpApiStatus('connecting');
            setSpApiError(null);
            try {
              // Call the API route to initialize SP-API client on the server
              const response = await fetch('/api/amazon-sp-api/connect', {
                method: 'GET',
              });

              const data = await response.json();

              if (response.ok) {
                setSpApiStatus('connected');
                console.log(data.message);
              } else {
                setSpApiStatus('error');
                setSpApiError(
                  data.error || 'Failed to connect to SP-API via API route.',
                );
                console.error('SP-API Connection Error:', data.error);
              }
            } catch (error: unknown) {
              console.error('SP-API Connection Error:', error);
              setSpApiStatus('error');
              setSpApiError(
                error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred.',
              );
            }
          }}
          disabled={spApiStatus === 'connecting'}
        >
          {spApiStatus === 'connecting'
            ? 'Connecting...'
            : 'Connect via SP-API'}
        </button>
        {spApiStatus === 'connected' && (
          <p className="text-green-600 dark:text-green-400 mt-2">
            Successfully connected to SP-API.
          </p>
        )}
        {spApiStatus === 'error' && (
          <p className="text-red-600 dark:text-red-400 mt-2">
            Error: {spApiError}
          </p>
        )}
      </div>
    </div>
  );
};

export default DataSourceTab;
