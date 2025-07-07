'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Add fallback prop here
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.name === 'ChunkLoadError';

      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-4 text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="max-w-md text-muted-foreground">
              {isChunkError
                ? 'Failed to load some required resources. This might be due to a network issue or an outdated version of the page.'
                : 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-4">
              <Button onClick={this.reload}>Reload page</Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
