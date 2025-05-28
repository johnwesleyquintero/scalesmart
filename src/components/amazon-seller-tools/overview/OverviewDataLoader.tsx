// src/components/amazon-seller-tools/overview/OverviewDataLoader.tsx
import React, { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Download, Info } from 'lucide-react';

interface OverviewDataLoaderProps {
  isParsing: boolean;
  isLoading: boolean;
  handleUploadClick: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>; // Updated type to include null
  handleLoadSampleData: () => void;
  handleDownloadSampleCsv: () => Promise<void>;
  hasMetrics: boolean;
}

const OverviewDataLoader: React.FC<OverviewDataLoaderProps> = ({
  isParsing,
  isLoading,
  handleUploadClick,
  handleFileChange,
  fileInputRef,
  handleLoadSampleData,
  handleDownloadSampleCsv,
  hasMetrics,
}) => {
  return (
    <div className="mb-4 p-4 border rounded-md bg-muted/40">
      {hasMetrics ? (
        <>
          <h3 className="text-lg font-semibold mb-2">Load Overview Data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Upload an Amazon Reports CSV to visualize your key metrics. You'll
            be asked to map the columns after uploading.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
            id="csvFileInput"
          />
          <Button onClick={handleUploadClick} disabled={isParsing || isLoading}>
            {isParsing ? 'Reading File...' : 'Choose Report File (.csv)'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadSampleCsv}
            className="ml-2"
          >
            <Download className="mr-2 h-4 w-4" /> Download Sample CSV
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">Load Overview Data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            To get started, choose to upload your own Amazon Business Report
            data or explore with sample data.
          </p>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleUploadClick}
              disabled={isParsing || isLoading}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                id="csvFileInput"
              />
              <label
                htmlFor="csvFileInput"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground h-10 px-4 py-2 cursor-pointer"
              >
                {isParsing ? 'Reading File...' : 'Upload Your Data (.csv)'}
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground ml-2" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Upload your Amazon Business Report data here. Ensure it
                      contains columns like 'Ordered Product Sales', 'Total
                      Order Items', etc.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadSampleData}
              disabled={isLoading}
            >
              Explore Sample Data
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleDownloadSampleCsv}
            className="ml-2"
          >
            <Download className="mr-2 h-4 w-4" /> Download Sample CSV
          </Button>
        </>
      )}
    </div>
  );
};

export default OverviewDataLoader;
