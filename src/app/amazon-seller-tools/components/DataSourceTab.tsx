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
  // updateAmazonReport, // Removed unused import
} from '@/lib/indexeddb/amazon-tools-db';
import { AmazonReport } from '@/types/indexeddb';
import {
  ProductResearchData,
  KeywordTrackingData,
  ListingOptimizationData,
  AnalyticsData,
  ParsedFileData,
  CompetitorMonitoringData, // Added
  InventoryData, // Added
  CustomerReviewData, // Added
} from '@/types/amazon-tools';

import { transformCsvData } from '@/lib/utils/csv-transformer';
import { CsvColumnMapping } from '@/types/data-mapping';
// import { CsvTransformerConfig } from '@/types/csv-transformer-config'; // Removed unused import
import { getReportConfig } from '@/lib/amazon-tools/reportProcessing';

import { Progress } from '@/components/ui/progress';

type DataType =
  | ProductResearchData
  | KeywordTrackingData
  | ListingOptimizationData
  | AnalyticsData
  | CompetitorMonitoringData // Added
  | InventoryData // Added
  | CustomerReviewData; // Added

interface DataSourceTabProps {
  currentTab: string; // Prop is unused in the current implementation
  // Changed onFileUpload signature to reflect per-file processing
  // If the intention was to pass ALL files and ALL data at the end, the signature and logic need adjustment.
  onFileUpload?: (file: File, parsedData: DataType[]) => void;
  // Added a more explicit callback for when a single file is parsed and saved
  onFileParsedAndSaved?: (report: AmazonReport) => void;
}

// Define a type for the file metadata stored in state and IndexedDB
interface UploadedFileMetadata {
  id?: string; // ID from IndexedDB
  name: string;
  category: string;
  uploadDate: number; // Use uploadDate for consistency with AmazonReport
  size: number; // Store size for display/info, 0 if not available (e.g., from DB load)
}

// Define state structure for SP-API
interface SpApiState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  region: 'na' | 'eu' | 'fe';
}

// Define state structure for parsing
interface ParsingState {
  isParsing: boolean;
  currentFileIndex: number;
  totalFiles: number;
  progress: number; // Progress for the current file (0-100)
  currentFileName: string | null;
}

/**
 * Transforms raw parsed CSV data based on a configured report category.
 * @param rawParsedData Array of objects representing rows from the CSV.
 * @param category The category string ('product-research', etc.) used to find the transformation config.
 * @param fileName The name of the file being processed (for logging).
 * @returns Transformed data array or the original raw data array if transformation fails or no config is found.
 */
const transformParsedData = (
  rawParsedData: Record<string, unknown>[],
  category: string,
  fileName: string,
): DataType[] | Record<string, unknown>[] => {
  const config = getReportConfig(category);

  if (!config) {
    console.warn(
      `No specific transformation defined or found for category: ${category}. Returning raw data for ${fileName}.`,
    );
    return rawParsedData;
  }

  try {
    // transformCsvData uses aliases in config to find columns, no separate mapping needed
    const transformed = transformCsvData(
      rawParsedData,
      {} as CsvColumnMapping, // Pass empty mapping as it's not used by transformCsvData with aliases
      config,
    );
    console.log(
      `Data transformed successfully for category: ${category}, file: ${fileName}. Transformed rows: ${transformed.length}`,
    );

    // Explicitly handle known categories and map/cast to their specific type
    if (category === 'analytics') {
      const analyticsData: AnalyticsData[] = transformed.map((item) => {
        const salesTrend = Array.isArray(item.salesTrend)
          ? item.salesTrend.map((trend: Record<string, unknown>) => ({
              date: String(trend.date),
              sales: Number(trend.sales),
            }))
          : [];
        return {
          ...item,
          salesTrend,
        } as AnalyticsData;
      });
      console.log(
        `Transformed analytics data structure before cast:`,
        analyticsData.slice(0, 5),
      );
      return analyticsData; // Return AnalyticsData[]
    } else if (category === 'product-research') {
      // Map each item and cast to ProductResearchData using 'as unknown as'
      return transformed.map((item) => item as unknown as ProductResearchData);
    } else if (category === 'keyword-tracking') {
      // Map each item and cast to KeywordTrackingData using 'as unknown as'
      return transformed.map((item) => item as unknown as KeywordTrackingData);
    } else if (category === 'listing-optimization') {
      // Map each item and cast to ListingOptimizationData using 'as unknown as'
      return transformed.map(
        (item) => item as unknown as ListingOptimizationData,
      );
    } else if (category === 'competitor-monitoring') {
      // Added
      // Map each item and cast to CompetitorMonitoringData
      return transformed.map(
        (item) => item as unknown as CompetitorMonitoringData,
      );
    } else if (category === 'inventory') {
      // Added
      // Map each item and cast to InventoryData
      return transformed.map((item) => item as unknown as InventoryData);
    } else if (category === 'customer-review') {
      // Added
      // Map each item and cast to CustomerReviewData
      return transformed.map((item) => item as unknown as CustomerReviewData);
    }
    // Add more else if blocks for other DataType members if needed

    // If category is known but not explicitly handled above, or if DataType union includes types not covered by configs
    console.warn(
      `Category "${category}" is known but not explicitly handled for specific type casting. Returning as generic DataType[].`,
    );
    console.log(
      `Transforming data for category: ${category}. Data structure before cast:`,
      transformed.slice(0, 5),
    ); // Log first 5 items
    // @ts-expect-error: The transformed data is expected to conform to DataType based on category config, but compiler cannot verify.
    return transformed as DataType[]; // Fallback generic cast - might still have issues if data doesn't match any DataType member
  } catch (error) {
    console.error(
      `Error transforming data for category ${category}, file ${fileName}:`,
      error,
    );
    // Return an empty array or re-throw the error if transformation is critical
    return [];
  }
};

const DataSourceTab: React.FC<DataSourceTabProps> = ({
  currentTab,
  onFileUpload,
  onFileParsedAndSaved,
}) => {
  // State to hold metadata of uploaded files (persisted in IndexedDB)
  const [uploadedFilesMetadata, setUploadedFilesMetadata] = useState<
    UploadedFileMetadata[]
  >([]);

  // State to hold all parsed data - potentially redundant if data is always read from DB when needed elsewhere
  // Keeping it for now as it was in the original code, assuming it's consumed by parent/other components
  const [allParsedData, setAllParsedData] = useState<
    ParsedFileData<DataType>[]
  >([]);

  // State for SP-API integration section
  const [spApiState, setSpApiState] = useState<SpApiState>({
    status: 'disconnected',
    error: null,
    refreshToken: '',
    clientId: '',
    clientSecret: '',
    region: 'na',
  });

  // State for managing file parsing progress and status
  const [parsingState, setParsingState] = useState<ParsingState>({
    isParsing: false,
    currentFileIndex: 0,
    totalFiles: 0,
    progress: 0,
    currentFileName: null,
  });

  // Effect hook to load reports from IndexedDB on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        const reports = await getAllAmazonReports();
        console.log(`Loaded ${reports.length} reports from IndexedDB.`);
        const metadataFromReports: UploadedFileMetadata[] = reports.map(
          (report) => ({
            id: report.id,
            name: report.fileName,
            category: report.category,
            uploadDate: report.uploadDate,
            size: 0, // Size is not stored in DB report, using 0 as placeholder
          }),
        );
        setUploadedFilesMetadata(metadataFromReports);
        // Populate allParsedData state from DB reports
        setAllParsedData(
          reports.map((report) => ({
            fileName: report.fileName,
            data: report.parsedData as DataType[],
          })),
        );
      } catch (error) {
        console.error('Failed to load Amazon reports from IndexedDB:', error);
        // TODO: Optionally show a user-friendly error message in the UI
      }
    };
    loadReports();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler for file input change event
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const filesArray = Array.from(files);

    // Initialize parsing state for the batch
    setParsingState({
      isParsing: true,
      currentFileIndex: 0,
      totalFiles: filesArray.length,
      progress: 0, // Progress for the first file
      currentFileName: null,
    });

    // Process files sequentially using async/await
    for (let i = 0; i < filesArray.length; i++) {
      const originalFile = filesArray[i];
      // TODO: Implement logic to determine category, perhaps based on file name pattern or user selection
      const fileCategory = 'product-research'; // Default or inferred category for demo

      // Update parsing state for the current file being processed
      setParsingState((prevState) => ({
        ...prevState,
        currentFileIndex: i + 1,
        progress: 0, // Reset progress for the new file
        currentFileName: originalFile.name,
      }));

      console.log(
        `Starting parse for file ${i + 1} of ${filesArray.length}: ${originalFile.name}`,
      );

      try {
        // Wrap PapaParse parsing in a promise to await its completion
        await new Promise<void>((resolve, reject) => {
          const parseConfig: PapaParse.ParseLocalConfig<
            Record<string, unknown>,
            File
          > = {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Attempt to automatically convert data types
            // worker: true, // Consider using web workers for large files to keep UI responsive
            step: (row, parser) => {
              // Update progress based on bytes processed. This is an approximation.
              // PapaParse's step might not guarantee meta.cursor increases linearly or reaches file size.
              if (originalFile.size > 0) {
                // meta.cursor is byte position at the end of the current chunk being processed
                const currentProgress = Math.round(
                  (row.meta.cursor / originalFile.size) * 100,
                );
                setParsingState((prevState) => ({
                  ...prevState,
                  // Cap progress at 99% during step to ensure `complete` callback feels like the final step
                  progress: Math.min(currentProgress, 99),
                }));
              }
            },
            complete: async (
              results: PapaParse.ParseResult<Record<string, unknown>>,
            ) => {
              console.log(
                `Parsing complete for ${originalFile.name}. Rows: ${results.data.length}. Errors: ${results.errors.length}`,
              );

              const rawParsedData: Record<string, unknown>[] = results.data;

              if (results.errors.length > 0) {
                console.warn(
                  `Parsing errors for ${originalFile.name}:`,
                  results.errors,
                );
                // TODO: Handle parsing errors, potentially show a warning to the user about this file
              }

              // Transform the parsed data based on the determined category
              const transformedData = transformParsedData(
                rawParsedData,
                fileCategory,
                originalFile.name,
              );

              // Create report object to save
              const report: AmazonReport = {
                fileName: originalFile.name,
                category: fileCategory,
                uploadDate: Date.now(),
                parsedData: transformedData as DataType[], // Cast after transformation attempt
              };

              try {
                // Save report to IndexedDB
                const id = await addAmazonReport(report);
                console.log(
                  `Saved report ${originalFile.name} to IndexedDB with ID: ${id}`,
                );

                // Create metadata for state
                const newMetadata: UploadedFileMetadata = {
                  id: id as string, // Assuming addAmazonReport returns string ID
                  name: report.fileName,
                  category: report.category,
                  uploadDate: report.uploadDate,
                  size: originalFile.size, // Store size from original file
                };

                // Update state for uploaded files list and all parsed data
                // Using functional updates to ensure we work with the latest state
                setUploadedFilesMetadata((prevMetadata) => [
                  ...prevMetadata,
                  newMetadata,
                ]);
                setAllParsedData((prevData) => [
                  ...prevData,
                  {
                    fileName: report.fileName,
                    data: transformedData as DataType[],
                  },
                ]);

                // Call callbacks notifying parent component for this file
                if (onFileUpload) {
                  onFileUpload(originalFile, transformedData as DataType[]); // Pass the single file and its data
                }
                if (onFileParsedAndSaved) {
                  onFileParsedAndSaved(report); // Provide the full report object
                }

                // Update progress to 100% for the current file visually
                setParsingState((prevState) => ({
                  ...prevState,
                  progress: 100,
                }));

                resolve(); // Resolve the promise, allowing the loop to continue to the next file
              } catch (dbError) {
                console.error(
                  `Error saving report ${originalFile.name} to IndexedDB:`,
                  dbError,
                );
                // Decide how to handle DB save error - skip file? Mark as failed?
                // Reject the promise so the outer catch block can handle it
                reject(dbError);
              }
            },
            error: (error: Error) => {
              // PapaParse Error callback receives error, not file object directly here
              console.error(`Error parsing file ${originalFile.name}:`, error);
              // Reject the promise on parsing error
              reject(error);
            },
          };

          // Start parsing the current file
          PapaParse.parse(originalFile, parseConfig);
        }); // End of new Promise
      } catch (error) {
        // This catch block handles errors from PapaParse error callback OR the DB save error rejection
        console.error(`Processing file ${originalFile.name} failed:`, error);
        // TODO: Optionally update state to show an error for this specific file or the batch
        // The loop will continue to the next file unless 'break' is added here
      }
      // Optional: Add a small delay before processing the next file to make progress updates more discernible
      // await new Promise(resolve => setTimeout(resolve, 100));
    } // End of for loop through files

    // After the loop completes for all files (either resolved or rejected promises)
    setParsingState((prevState) => ({
      ...prevState,
      isParsing: false,
      // Ensure final state reflects total files processed
      currentFileIndex: filesArray.length,
      totalFiles: filesArray.length,
      progress: 100, // Ensure progress shows complete state for the entire batch visually
      currentFileName: null,
    }));
    console.log(`Finished processing ${filesArray.length} selected file(s).`);
  };

  // SP-API state handlers
  const handleSpApiInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setSpApiState((prevState) => ({
      ...prevState,
      [id]: value, // Assumes input ID matches state key ('refreshToken', 'clientId', etc.)
    }));
  };

  const connectSpApi = () => {
    // Placeholder for SP-API connection logic
    console.log('Attempting to connect to SP-API with:', spApiState);
    setSpApiState((prevState) => ({
      ...prevState,
      status: 'connecting',
      error: null,
    }));
    // Simulate an asynchronous API call
    setTimeout(() => {
      // Simulate success or failure randomly
      const success = Math.random() > 0.5;
      if (success) {
        setSpApiState((prevState) => ({
          ...prevState,
          status: 'connected',
          error: null,
        }));
        console.log('SP-API Connected successfully.');
      } else {
        const errorMessage =
          'Failed to authenticate. Check credentials and region.';
        setSpApiState((prevState) => ({
          ...prevState,
          status: 'error',
          error: errorMessage,
        }));
        console.error('SP-API Connection Failed:', errorMessage);
        // TODO: Display spApiState.error to the user in the UI
      }
    }, 1500); // Simulate network delay
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Amazon Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-upload">Upload CSV File(s)</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              multiple
              disabled={parsingState.isParsing} // Disable input during parsing
            />
            {/* Parsing Progress Display */}
            {parsingState.isParsing && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Processing {parsingState.currentFileIndex} of{' '}
                  {parsingState.totalFiles} files:{' '}
                  {parsingState.currentFileName}
                </p>
                {/* Show progress bar if total files > 0 */}
                {parsingState.totalFiles > 0 && (
                  <Progress value={parsingState.progress} className="w-full" />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            Uploaded Reports ({uploadedFilesMetadata.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFilesMetadata.length === 0 ? (
            <p className="text-muted-foreground">No reports uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFilesMetadata.map((fileMetadata) => (
                // Using fileMetadata.id as key is best if available, fallback to name+date if needed
                <Card
                  key={
                    fileMetadata.id ||
                    `${fileMetadata.name}-${fileMetadata.uploadDate}`
                  }
                  className="relative"
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{fileMetadata.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Category:{' '}
                      <Badge variant="secondary">{fileMetadata.category}</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded:{' '}
                      {new Date(fileMetadata.uploadDate).toLocaleDateString()}
                    </p>
                    {fileMetadata.id && (
                      <p className="text-xs text-muted-foreground">
                        ID: {String(fileMetadata.id).substring(0, 8)}...
                      </p>
                    )}
                    {/* Display size if greater than 0 */}
                    {fileMetadata.size > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Size: {(fileMetadata.size / 1024).toFixed(2)} KB
                      </p>
                    )}
                    {/* TODO: Add actions like View, Delete, Edit Category for saved reports */}
                    <div className="mt-3 flex space-x-2">
                      {/* <button className="text-xs text-blue-600 hover:underline">View</button> */}
                      {/* <button className="text-xs text-red-600 hover:underline">Delete</button> */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SP-API Integration Section */}
      <Card>
        <CardHeader>
          <CardTitle>SP-API Integration (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Connect directly to Amazon's Selling Partner API for real-time data.
          </p>
          <div className="space-y-4">
            {/* Refresh Token Input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="refreshToken">Refresh Token</Label>
              <Input
                id="refreshToken" // Match state key
                type="password"
                value={spApiState.refreshToken}
                onChange={handleSpApiInputChange}
                placeholder="Enter your refresh token"
                disabled={spApiState.status === 'connecting'}
              />
            </div>
            {/* Client ID Input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId" // Match state key
                type="text"
                value={spApiState.clientId}
                onChange={handleSpApiInputChange}
                placeholder="Enter your client ID"
                disabled={spApiState.status === 'connecting'}
              />
            </div>
            {/* Client Secret Input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret" // Match state key
                type="password"
                value={spApiState.clientSecret}
                onChange={handleSpApiInputChange}
                placeholder="Enter your client secret"
                disabled={spApiState.status === 'connecting'}
              />
            </div>
            {/* Region Select */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="region">Region</Label>
              <select
                id="region" // Match state key
                value={spApiState.region}
                onChange={handleSpApiInputChange}
                disabled={spApiState.status === 'connecting'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="na">North America (NA)</option>
                <option value="eu">Europe (EU)</option>
                <option value="fe">Far East (FE)</option>
              </select>
            </div>
            {/* Connect Button */}
            <button
              onClick={connectSpApi}
              className={`px-4 py-2 text-white rounded ${
                spApiState.status === 'connecting'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={spApiState.status === 'connecting'}
            >
              {spApiState.status === 'connecting'
                ? 'Connecting...'
                : 'Connect to SP-API'}
            </button>
            {/* SP-API Status Badges */}
            {spApiState.status === 'connected' && (
              <Badge variant="secondary">Connected</Badge>
            )}
            {spApiState.status === 'error' && (
              <Badge variant="destructive">Error: {spApiState.error}</Badge>
            )}
            {spApiState.status === 'connecting' && (
              <Badge variant="outline">Attempting connection...</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSourceTab;
