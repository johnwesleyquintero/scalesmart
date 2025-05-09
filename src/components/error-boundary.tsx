'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type React from 'react';
import { Component } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/30 dark:bg-red-900/20">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-red-800 dark:text-red-400">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Please refer to the&nbsp;
            <a href="/docs/error-guide.md" className="underline">
              error guide
            </a>
            &nbsp; for further details.
          </p>
          <p className="mb-6 max-w-md text-red-700 dark:text-red-300">
            We apologize for the inconvenience. An unexpected error has
            occurred.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
          {this.state.error &&
            (process.env.NODE_ENV === 'development' ||
              process.env.NODE_ENV === 'test') && (
              <div className="mt-6 max-w-md overflow-auto rounded border border-red-300 bg-white p-4 text-left text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300">
                <p className="font-mono font-bold">
                  {this.state.error!.name}: {this.state.error!.message}
                </p>
                <pre className="mt-2 text-xs">{this.state.error.stack}</pre>
              </div>
            )}
        </div>
      ); // End of return for error case
    } // <<<--- ADDED THIS CLOSING BRACE

    // This is the return for the non-error case
    return <>{this.props.children}</>;
  }
}

export default ErrorBoundary;
