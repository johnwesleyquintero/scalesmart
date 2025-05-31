'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';

interface HtmlPreviewProps {
  htmlContent: string;
  title?: string;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  htmlContent,
  title = 'HTML Preview',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [iframeHeight, setIframeHeight] = useState('200px'); // Default height

  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    USE_PROFILES: { html: true },
  });

  const updateIframeContent = useCallback(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 10px; font-family: sans-serif; overflow-x: hidden; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${sanitizedHtml}
          </body>
          </html>
        `);
        doc.close();

        // Adjust iframe height to content
        const adjustHeight = () => {
          if (doc.body.scrollHeight > 0) {
            setIframeHeight(`${doc.body.scrollHeight + 20}px`); // Add some padding
          }
        };

        // Listen for content load to adjust height
        iframe.onload = adjustHeight;
        // Also try to adjust immediately in case content loads before onload fires
        adjustHeight();
      }
    }
  }, [sanitizedHtml]);

  useEffect(() => {
    updateIframeContent();
  }, [updateIframeContent]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const modalClass = isMaximized
    ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4'
    : '';
  const contentClass = isMaximized
    ? 'w-full h-full max-w-full max-h-full rounded-lg shadow-2xl'
    : 'w-full rounded-lg shadow-md';

  return (
    <div
      className={`my-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${modalClass}`}
    >
      <div className={`flex flex-col ${contentClass} overflow-hidden`}>
        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h4>
          <Button
            onClick={toggleMaximize}
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={isMaximized ? 'Minimize preview' : 'Maximize preview'}
          >
            {isMaximized ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc="about:blank" // Use about:blank to prevent initial load issues
            title={title}
            sandbox="allow-scripts allow-same-origin" // Allow scripts to run within the same origin
            className="w-full h-full border-0"
            style={{ height: isMaximized ? '100%' : iframeHeight }}
          />
        </div>
      </div>
    </div>
  );
};

export default HtmlPreview;
