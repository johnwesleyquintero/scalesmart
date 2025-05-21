'use client';

import { Button } from '@/components/ui/button';
import { BookOpen, Download, Loader2, RefreshCw } from 'lucide-react';
import React, { useCallback } from 'react';

interface DashboardHeaderProps {
  isLoading: boolean;
  isParsing: boolean;
  error: string | null;
  metricsLength: number;
  handleRefresh: () => void;
  handleExport: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isLoading,
  isParsing,
  error,
  metricsLength,
  handleRefresh,
  handleExport,
}) => {
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
            onClick={handleExport}
            aria-label="Export Data"
            disabled={metricsLength === 0 || isLoading || isParsing}
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button variant="outline" asChild aria-label="View Documentation">
            <a
              href="https://wescode.vercel.app/blog/amazon-seller-tools"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen className="w-4 h-4 mr-2" /> Docs
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
