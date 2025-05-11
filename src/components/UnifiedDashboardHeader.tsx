import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onExport: () => void;
}

export function UnifiedDashboardHeader({
  isLoading,
  error,
  onRefresh,
  onExport,
}: Readonly<HeaderProps>) {
  return (
    <div className="mb-12" aria-live="polite">
      {' '}
      {/* Consistent bottom margin for the header block */}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-6">
        {' '}
        {/* Centered, styled title */}
        Amazon Seller Tools Dashboard
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Status Indicators (left side on sm+) */}
        <div className="flex items-center space-x-2 min-h-[24px]">
          {' '}
          {/* min-h to prevent layout shift */}
          {isLoading && (
            <div className="flex items-center">
              <Spinner className="mr-2 h-5 w-5" />
              <span className="text-sm text-muted-foreground">
                Refreshing...
              </span>
            </div>
          )}
          {error &&
            !isLoading && ( // Show error only if not loading, to prevent overlap
              <span className="text-sm text-red-500" role="alert">
                {error}
              </span>
            )}
        </div>

        {/* Action Buttons (right side on sm+) */}
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <Button
            variant="outline"
            onClick={onRefresh}
            aria-label="Refresh Dashboard"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={onExport} aria-label="Export Data">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild aria-label="View Documentation">
            <a
              href="https://wescode.vercel.app/blog/amazon-seller-tools"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Docs
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
