import React, { useCallback, useState, useEffect } from 'react';
import useDebounce from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Download, Loader2, RefreshCw, Settings } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DashboardPdf from './DashboardPdf';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';
import { saveAs } from 'file-saver';
import KpiCustomizationModal from './KpiCustomizationModal';
import { getItem } from '@/lib/indexeddb-service';

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

  useEffect(() => {
    const getStoredMetrics = async () => {
      const storedMetrics = await getItem<string[]>('selectedMetrics');
      if (storedMetrics) {
        setSelectedMetrics(storedMetrics);
      }
    };

    getStoredMetrics();
  }, []);

  const handleSaveKpiModal = (newSelectedMetrics: string[]) => {
    setSelectedMetrics(newSelectedMetrics);
  };

  const handlePrint = useCallback(() => {
    // Prepare data for the PDF
    const title = 'Dashboard Report';
    const content = JSON.stringify(metrics, null, 2); // Convert metrics to string for PDF
    setPdfData({ title, content });
  }, [metrics]);

  const handleExportData = () => {
    if (metrics && metrics.length > 0) {
      const csv = convertToCSV(metrics);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'dashboard_data.csv');
    } else {
      alert('No data to export.');
    }
  };

  const convertToCSV = (data: DashboardMetrics[]) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map((obj) => Object.values(obj).join(','));
    return `${headers}\n${rows.join('\n')}`;
  };

  return (
    <div className="mb-12" aria-live="polite">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2 min-h-[24px]">
          {(isLoading || isParsing) && (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                {isParsing ? 'Processing file...' : 'Refreshing...'}
              </span>
            </div>
          )}
          {error && !(isLoading || isParsing) && (
            <span className="text-sm text-red-500" role="alert">
              {error}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <Button
            variant="outline"
            onClick={handleRefresh}
            aria-label="Refresh Dashboard"
            disabled={isLoading || isParsing}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            aria-label="Export Data"
            disabled={metricsLength === 0 || isLoading || isParsing}
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            aria-label="Print Report"
            disabled={metricsLength === 0 || isLoading || isParsing}
          >
            Print
          </Button>
          {pdfData && (
            <PDFDownloadLink
              document={
                <DashboardPdf title={pdfData.title} content={pdfData.content} />
              }
              fileName="dashboard.pdf"
            >
              {({ loading }) =>
                loading ? (
                  'Loading document...'
                ) : (
                  <Button
                    variant="outline"
                    aria-label="Download PDF"
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                )
              }
            </PDFDownloadLink>
          )}
          <Button variant="outline" asChild aria-label="View Documentation">
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
              className="w-64 px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="search"
              placeholder="Search ASIN, Identifier, Keyword..."
              id="global-search"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearch(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Tab') {
                  // Logic to move focus to suggestions or the table
                }
              }}
            />
            <span className="absolute right-3 text-gray-400">
              <Settings className="w-4 h-4 mr-2" />
            </span>
          </div>
          <KpiCustomizationModal
            defaultMetrics={selectedMetrics}
            onSave={handleSaveKpiModal}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
