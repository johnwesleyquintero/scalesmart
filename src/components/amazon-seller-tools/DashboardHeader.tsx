/**
 * @file DashboardHeader.tsx
 * @description This component provides the header for the Amazon Seller Tools dashboard,
 * including status indicators, action buttons (refresh, export, print, docs),
 * a search input, and a KPI customization modal.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Download, Loader2, RefreshCw, Settings } from 'lucide-react';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';
import KpiCustomizationModal from './KpiCustomizationModal';
import { getCacheItem } from '@/lib/api-cache';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';

// Dynamically import PDF components to ensure SSR is disabled
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false },
);
const DashboardPdf = dynamic(() => import('./DashboardPdf'), { ssr: false });

/**
 * Props for the DashboardHeader component.
 * @interface DashboardHeaderProps
 * @property {boolean} isLoading - Indicates if data is currently loading.
 * @property {boolean} isParsing - Indicates if data is currently being parsed.
 * @property {string | null} error - Any error message to display.
 * @property {number} metricsLength - The number of metrics currently loaded.
 * @property {() => void} handleRefresh - Callback to refresh the dashboard data.
 * @property {() => void} handleExport - Callback to export the dashboard data.
 * @property {DashboardMetrics[]} metrics - The array of dashboard metrics.
 * @property {(searchTerm: string) => void} onSearch - Callback for search input changes.
 */
interface DashboardHeaderProps {
  isLoading: boolean;
  isParsing: boolean;
  error: string | null;
  metricsLength: number;
  handleRefresh: () => void;
  handleExport: () => void;
  metrics: DashboardMetrics[];
  onSearch: (searchTerm: string) => void;
}

/**
 * `DashboardHeader` component displays the status, actions, and search functionality
 * for the Amazon Seller Tools dashboard.
 * @param {DashboardHeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered dashboard header.
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isLoading,
  isParsing,
  error,
  metricsLength,
  handleRefresh,
  handleExport,
  metrics,
  onSearch,
}) => {
  const [pdfData, setPdfData] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  /**
   * Effect hook to load previously selected KPI metrics from IndexedDB cache.
   */
  useEffect(() => {
    const getStoredMetrics = async () => {
      const storedMetrics = await getCacheItem<string[]>('selectedMetrics');
      if (storedMetrics) {
        setSelectedMetrics(storedMetrics);
      }
    };
    getStoredMetrics();
  }, []);

  /**
   * Callback function to handle saving the KPI customization modal settings.
   * @param {string[]} newSelectedMetrics - The newly selected metrics from the modal.
   */
  const handleSaveKpiModal = (newSelectedMetrics: string[]) => {
    setSelectedMetrics(newSelectedMetrics);
  };

  /**
   * Prepares data for PDF export.
   * Note: For a real application, `JSON.stringify(metrics, null, 2)` might not be
   * the ideal content for a user-friendly PDF. A more structured report generation
   * would be beneficial.
   */
  const handlePrint = useCallback(() => {
    const title = 'Dashboard Report';
    const content = JSON.stringify(metrics, null, 2); // Convert metrics to string for PDF
    setPdfData({ title, content });
  }, [metrics]);

  return (
    <div className="mb-12 p-4 rounded-lg shadow-md" aria-live="polite">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2 min-h-[24px]">
          {(isLoading || isParsing) && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                {isParsing ? 'Processing file...' : 'Refreshing...'}
              </span>
            </div>
          )}
          {error && !(isLoading || isParsing) && (
            <span
              className="text-sm text-red-500 dark:text-red-400"
              role="alert"
            >
              {error}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  aria-label="Refresh Dashboard"
                  disabled={isLoading || isParsing}
                  className="border-gray-300  text-gray-800 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Clear all loaded data, errors, and reset dashboard states.
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  aria-label="Export Data"
                  disabled={metricsLength === 0 || isLoading || isParsing}
                  className="border-gray-300  text-gray-800 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export current data as CSV.</p>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              onClick={handlePrint}
              aria-label="Print Report"
              disabled={metricsLength === 0 || isLoading || isParsing}
              className="border-gray-300  text-gray-800 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Print
            </Button>
            {pdfData && PDFDownloadLink && DashboardPdf && (
              <PDFDownloadLink
                document={
                  <DashboardPdf
                    title={pdfData.title}
                    content={pdfData.content}
                  />
                }
                fileName="dashboard.pdf"
              >
                {({ loading }) => (
                  <Button
                    variant="outline"
                    aria-label="Download PDF"
                    disabled={loading}
                    className="border-gray-300  text-gray-800 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Loading document...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
            <Button
              variant="outline"
              asChild
              aria-label="Docs: Amazon Seller Tools Documentation"
              className="border-gray-300  text-gray-800 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <a
                href="https://wescode.vercel.app/blog/amazon-seller-tools"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Docs
              </a>
            </Button>
            <div className="relative flex items-center">
              <Input
                className="w-64 border-gray-300 px-4 py-2 pr-10 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                type="search"
                placeholder="Search ASIN, Identifier, Keyword..."
                id="global-search"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onSearch(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  // Removed comment about focus logic as it's not implemented
                }}
              />
              <span className="absolute right-3 text-gray-400 dark:text-gray-500">
                <Settings className="w-4 h-4 mr-2" />
              </span>
            </div>
            <KpiCustomizationModal
              defaultMetrics={selectedMetrics}
              onSave={handleSaveKpiModal}
            />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
