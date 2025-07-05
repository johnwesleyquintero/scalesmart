// src/app/amazon-seller-tools/components/DataSourceTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import * as PapaParse from 'papaparse';
import {
  addAmazonReport,
  getAllAmazonReports,
  deleteAmazonReport, // Added import for delete function
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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [savedReports, setSavedReports] = useState<AmazonReport[]>([]);

  // Define constants for duplicated strings
  const TOAST_TITLE_REPORT_DELETED = 'Report Deleted';
  const TOAST_DESCRIPTION_REPORT_DELETED = (reportName: string) =>
    `Report ${reportName} has been successfully deleted.`;
  const TOAST_TITLE_ERROR = 'Error';
  const TOAST_DESCRIPTION_DELETE_FAILED = (error: unknown) =>
    `Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`;
  const TOAST_TITLE_LOAD_ERROR = 'Error Loading Reports';
  const TOAST_DESCRIPTION_LOAD_FAILED =
    'Failed to load your saved reports. Please try again.';
  const TOAST_TITLE_SP_API_ERROR = 'SP-API Connection Error';
  const TOAST_DESCRIPTION_SP_API_FAILED =
    'Failed to connect to Amazon SP-API. Please check your credentials.';

  // Placeholder for viewing report details
  const handleViewReportDetails = (report: AmazonReport) => {
    toast({
      title: 'View Report Details',
      description: `Viewing details for report: ${report.fileName} (ID: ${report.id})`,
    });

    console.log('View Report Details:', report);
  };

  // Placeholder for re-processing a report
  const handleReprocessReport = (report: AmazonReport) => {
    toast({
      title: 'Re-process Report',
      description: `Re-processing report: ${report.fileName} (ID: ${report.id})`,
    });

    console.log('Re-process Report:', report);
  };
  const TOAST_TITLE_FILE_PROCESSING_ERROR = 'File Processing Error';
  const TOAST_DESCRIPTION_FILE_PROCESSING_FAILED =
    'There was an error processing your file. Please ensure it is a valid CSV.';

  // Handler to delete a report by its ID
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteAmazonReport(reportId);
      console.log(`Report with ID ${reportId} deleted from IndexedDB.`);
      // Update state to remove the deleted report
      setUploadedFilesMetadata((prevMetadata) =>
        prevMetadata.filter((metadata) => metadata.id !== reportId),
      );
      setAllParsedData((prevData) =>
        prevData.filter((data) => {
          // Find the metadata for the deleted report to get its file name
          const deletedMetadata = uploadedFilesMetadata.find(
            (metadata) => metadata.id === reportId,
          );
          // Only keep data entries whose file name does NOT match the deleted report's file name
          // This assumes file names are unique identifiers for data entries in allParsedData
          return data.fileName !== deletedMetadata?.name;
        }),
      );
      // After successful deletion from IndexedDB, update UI state
      toast({
        title: 'Report Deleted',
        description: `Report with ID ${reportId} has been successfully deleted.`, // Simplified message as deletedMetadata is not directly available here
      });
    } catch (error) {
      console.error(`Error deleting report with ID ${reportId}:`, error);
      toast({
        title: TOAST_TITLE_ERROR,
        description: TOAST_DESCRIPTION_DELETE_FAILED(error),
      });
    } finally {
      // Ensure the UI reflects the latest state after deletion attempt
      // This might involve re-fetching reports or simply removing from local state
      // For now, we'll just log that the report was deleted from the local state.
      // The onReportDeleted callback (if implemented) would be called here.
    }
  };

  // Define constants for duplicated strings

  // State to hold metadata of uploaded files (persisted in IndexedDB)
  const [uploadedFilesMetadata, setUploadedFilesMetadata] = useState<
    UploadedFileMetadata[]
  >([]);

  // State to hold the currently selected category for file uploads
  const [selectedCategory, setSelectedCategory] = useState<string>('analytics'); // Default to analytics

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
        setSavedReports(reports);
      } catch (error) {
        console.error('Failed to load saved reports:', error);
        toast({
          title: TOAST_TITLE_LOAD_ERROR,
          description: TOAST_DESCRIPTION_LOAD_FAILED,
          variant: 'destructive',
        });
      }
    };
    loadReports();
  }, [toast]);

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
      // Use the selected category from state
      const fileCategory = selectedCategory;

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
                toast({
                  title: 'Parsing Warnings',
                  description: `Some errors occurred while parsing ${originalFile.name}. Data might be incomplete.`,
                  variant: 'warning',
                });
              }

              // Transform the parsed data based on the determined category
              const transformedData = transformParsedData(
                rawParsedData,
                fileCategory,
                originalFile.name,
              );

              // Create report object to save
              const report: AmazonReport = {
                id: crypto.randomUUID(), // Add a unique ID
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
        toast({
          title: TOAST_TITLE_FILE_PROCESSING_ERROR,
          description: TOAST_DESCRIPTION_FILE_PROCESSING_FAILED,
          variant: 'destructive',
        });
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
        toast({
          title: TOAST_TITLE_SP_API_ERROR,
          description: TOAST_DESCRIPTION_SP_API_FAILED,
          variant: 'destructive',
        });
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
            {/* Category Selection */}
            <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
              <Label htmlFor="report-category">Report Category</Label>
              <select
                id="report-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={parsingState.isParsing}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="analytics">Analytics</option>
                <option value="product-research">Product Research</option>
                <option value="keyword-tracking">Keyword Tracking</option>
                <option value="listing-optimization">
                  Listing Optimization
                </option>
                <option value="competitor-monitoring">
                  Competitor Monitoring
                </option>
                <option value="inventory">Inventory Management</option>
                <option value="customer-review">Customer Reviews</option>
              </select>
            </div>
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
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Category:{' '}
                        <Badge variant="secondary">
                          {fileMetadata.category}
                        </Badge>
                      </p>
                    </div>
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
                    <div className="mt-3 flex space-x-2">
                      {fileMetadata.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const report = savedReports.find(
                                (r) => r.id === fileMetadata.id,
                              );
                              if (report) {
                                handleViewReportDetails(report);
                              }
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const report = savedReports.find(
                                (r) => r.id === fileMetadata.id,
                              );
                              if (report) {
                                handleReprocessReport(report);
                              }
                            }}
                          >
                            Re-process
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteReport(fileMetadata.id!)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
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
