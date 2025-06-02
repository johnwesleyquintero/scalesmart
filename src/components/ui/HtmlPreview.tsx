'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';
import {
  Maximize,
  Minimize,
  Copy,
  Check,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface HtmlPreviewProps {
  htmlContent: string;
  title?: string;
  className?: string;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  htmlContent,
  title = 'HTML Preview',
  className = '',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { theme: currentTheme } = useTheme();
  const [state, setState] = useState({
    isMaximized: false,
    viewMode: 'preview' as 'preview' | 'code',
    editableCode: htmlContent,
    appliedHtmlContent: htmlContent,
    copied: false,
    hasEdited: false,
    isLoadingIframe: true,
  });

  // Derived state
  const {
    isMaximized,
    viewMode,
    editableCode,
    appliedHtmlContent,
    copied,
    hasEdited,
    isLoadingIframe,
  } = state;

  // Update state when htmlContent prop changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      editableCode: htmlContent,
      appliedHtmlContent: htmlContent,
      copied: false,
      hasEdited: false,
      isLoadingIframe: true,
    }));
  }, [htmlContent]);

  // Memoized iframe source document
  const iframeSrcDoc = useMemo(() => {
    const sanitizedAiHtmlString = DOMPurify.sanitize(appliedHtmlContent, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe'], // Allow iframes if needed
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    });

    const aiParser = new DOMParser();
    const aiDoc = aiParser.parseFromString(sanitizedAiHtmlString, 'text/html');

    // Extract and combine all styles
    const styleElements = Array.from(aiDoc.querySelectorAll('style'));
    const aiStylesString = styleElements.map((el) => el.outerHTML).join('');
    styleElements.forEach((el) => el.remove());

    const aiBodyContent = aiDoc.body.innerHTML;

    return `
      <!DOCTYPE html>
      <html class="${currentTheme}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Base styles */
          body {
            margin: 0;
            padding: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            overflow-x: hidden;
            transition: background-color 0.3s, color 0.3s;
          }
          
          /* Theme variables */
          html {
            --text-color: #333;
            --bg-color: #f0f0f0;
            --heading-color: #222;
            --link-color: #007bff;
            --border-color: #ddd;
            --th-bg-color: #f2f2f2;
            --code-color: #c7254e;
            --code-bg: #f9f2f4;
            --pre-bg: #f5f5f5;
            --pre-color: #333;
          }
          
          html.dark {
            --text-color: #ccc;
            --bg-color: #1e1e1e;
            --heading-color: #eee;
            --link-color: #58a6ff;
            --border-color: #444;
            --th-bg-color: #2a2a2a;
            --code-color: #ff7b72;
            --code-bg: #2d2d2d;
            --pre-bg: #2c2c2c;
            --pre-color: #ccc;
          }
          
          /* Applied styles using variables */
          body { color: var(--text-color); background-color: var(--bg-color); }
          h1, h2, h3, h4, h5, h6 { color: var(--heading-color); }
          a { color: var(--link-color); }
          th, td { border-color: var(--border-color); }
          th { background-color: var(--th-bg-color); }
          code { color: var(--code-color); background-color: var(--code-bg); }
          pre { background-color: var(--pre-bg); color: var(--pre-color); }

          /* Common element styles */
          h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; }
          p { margin-bottom: 1em; }
          a { text-decoration: none; }
          a:hover { text-decoration: underline; }
          ul, ol { margin-bottom: 1em; }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 8px; text-align: left; }
          pre { padding: 9.5px; margin: 0 0 10px; overflow: auto; }
        </style>
        ${aiStylesString}
      </head>
      <body>
        ${aiBodyContent}
      </body>
      </html>
    `;
  }, [appliedHtmlContent, currentTheme]);

  // Handlers
  const toggleMaximize = () => {
    setState((prev) => ({ ...prev, isMaximized: !prev.isMaximized }));
  };

  const toggleViewMode = () => {
    setState((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'preview' ? 'code' : 'preview',
    }));
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editableCode);
    setState((prev) => ({ ...prev, copied: true }));
    setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000);
  }, [editableCode]);

  const handleReset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editableCode: htmlContent,
      hasEdited: false,
    }));
  }, [htmlContent]);

  const handleApplyChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      appliedHtmlContent: prev.editableCode,
      hasEdited: false,
      isLoadingIframe: true,
    }));
  }, []);

  const handleCodeChange = useCallback(
    (code: string) => {
      setState((prev) => ({
        ...prev,
        editableCode: code,
        hasEdited: code !== htmlContent,
      }));
    },
    [htmlContent],
  );

  // Classes
  const containerClasses = `my-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden ${
    isMaximized
      ? 'fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center p-4'
      : ''
  } ${className}`;

  const contentClasses = `flex flex-col w-full h-full ${
    isMaximized
      ? 'max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl'
      : 'rounded-lg shadow-md'
  }`;

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
            {title}
          </h4>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleViewMode}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              aria-label={viewMode === 'preview' ? 'Show code' : 'Show preview'}
            >
              {viewMode === 'preview' ? 'Code' : 'Preview'}
            </Button>

            {viewMode === 'code' && (
              <>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs gap-1"
                  aria-label={copied ? 'Copied' : 'Copy code'}
                >
                  {copied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>

                {hasEdited && (
                  <>
                    <Button
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Reset code"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleApplyChanges}
                      variant="default"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                      aria-label="Apply changes"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Apply
                    </Button>
                  </>
                )}
              </>
            )}

            <Button
              onClick={toggleMaximize}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              aria-label={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {viewMode === 'preview' ? (
          <div className="relative flex-1 min-h-[300px]">
            {isLoadingIframe && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">
                  Loading preview...
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={iframeSrcDoc}
              title={title}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
              style={{ minHeight: isMaximized ? 'calc(90vh - 60px)' : '300px' }}
              onLoad={() =>
                setState((prev) => ({ ...prev, isLoadingIframe: false }))
              }
            />
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto"
            style={{ minHeight: isMaximized ? 'calc(90vh - 60px)' : '300px' }}
          >
            <Editor
              value={editableCode}
              onValueChange={handleCodeChange}
              highlight={(code) =>
                Prism.highlight(code, Prism.languages.markup, 'markup')
              }
              padding={12}
              className="font-mono text-sm"
              style={{
                minHeight: '100%',
                backgroundColor: '#282a36',
                color: '#f8f8f2',
                fontFamily: '"Fira Code", monospace',
              }}
              textareaClassName="outline-none"
              preClassName="outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HtmlPreview;
