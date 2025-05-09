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
    <div className="flex justify-between items-center mb-6" aria-live="polite">
      <h1 className="text-2xl font-bold">Amazon Seller Tools Dashboard</h1>
      <div className="flex items-center space-x-4">
        {isLoading && (
          <div className="flex items-center">
            <Spinner className="mr-2" />
            <span className="text-sm text-gray-500">Refreshing...</span>
          </div>
        )}
        {error && (
          <span className="text-sm text-red-500" role="alert">
            {error}
          </span>
        )}
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            aria-label="Refresh Dashboard"
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
