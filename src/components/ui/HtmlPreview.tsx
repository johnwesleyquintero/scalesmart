'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup'; // For HTML
import 'prismjs/components/prism-css'; // For CSS within <style>
import 'prismjs/components/prism-javascript'; // For JS within <script> if ever allowed
import 'prismjs/themes/prism-tomorrow.css'; // Import a dark theme for syntax highlighting
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
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview'); // 'preview' or 'code'
  const [editableCode, setEditableCode] = useState(htmlContent);
  const [appliedHtmlContent, setAppliedHtmlContent] = useState(htmlContent); // New state for content applied to iframe
  const [currentTheme, setCurrentTheme] = useState('light');
  const [copied, setCopied] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [isLoadingIframe, setIsLoadingIframe] = useState(true); // New state for iframe loading

  useEffect(() => {
    setEditableCode(htmlContent); // Update editable code if the prop changes
    setAppliedHtmlContent(htmlContent); // Also update applied content
    setCopied(false); // Reset copied status when content changes
    setHasEdited(false); // Reset edited status when content changes
    setIsLoadingIframe(true); // Set loading to true when content changes
  }, [htmlContent]);

  useEffect(() => {
    // This effect ensures the iframe updates when appliedHtmlContent changes
    // and also resets hasEdited if the content matches the original prop
    if (editableCode === htmlContent) {
      setHasEdited(false);
    }
  }, [editableCode, htmlContent]);

  useEffect(() => {
    // Check initial theme
    const isDark = document.documentElement.classList.contains('dark');
    setCurrentTheme(isDark ? 'dark' : 'light');

    // Observe theme changes on the documentElement
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const isNowDark = (mutation.target as HTMLElement).classList.contains(
            'dark',
          );
          setCurrentTheme(isNowDark ? 'dark' : 'light');
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  const handleReset = () => {
    setEditableCode(htmlContent);
    setHasEdited(false);
  };

  useEffect(() => {
    // This effect ensures the iframe updates when appliedHtmlContent changes
    // and also resets hasEdited if the content matches the original prop
    if (editableCode === htmlContent) {
      setHasEdited(false);
    }
    setIsLoadingIframe(true); // Set loading to true when applied content changes
  }, [appliedHtmlContent, htmlContent, editableCode]); // Added editableCode to dependencies

  const getIframeSrcDoc = useCallback(() => {
    const sanitizedAiHtmlString = DOMPurify.sanitize(appliedHtmlContent, {
      USE_PROFILES: { html: true },
    });

    const aiParser = new DOMParser();
    const aiDoc = aiParser.parseFromString(sanitizedAiHtmlString, 'text/html');

    let aiStylesString = '';
    const allAiStyleElements = aiDoc.querySelectorAll('style');
    allAiStyleElements.forEach((styleEl) => {
      aiStylesString += styleEl.outerHTML;
      styleEl.remove();
    });

    const aiBodyContent = aiDoc.body.innerHTML;

    return `
      <!DOCTYPE html>
      <html class="${currentTheme}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* HtmlPreview Component's Default Styles */
          /* Common base styles */
          body {
            margin: 0;
            padding: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            line-height: 1.6;
            overflow-x: hidden;
            transition: background-color 0.3s, color 0.3s;
          }
          /* Light theme styles (default) */
          html:not(.dark) body { color: #333; background-color: #f0f0f0; }
          html:not(.dark) h1, html:not(.dark) h2, html:not(.dark) h3, html:not(.dark) h4, html:not(.dark) h5, html:not(.dark) h6 { color: #222; }
          html:not(.dark) a { color: #007bff; }
          html:not(.dark) th, html:not(.dark) td { border-color: #ddd; }
          html:not(.dark) th { background-color: #f2f2f2; }
          html:not(.dark) button, html:not(.dark) input[type="button"], html:not(.dark) input[type="submit"], html:not(.dark) input[type="reset"] {
            color: #212529; background-color: #f8f9fa; border-color: #ced4da;
          }
          html:not(.dark) button:hover, html:not(.dark) input[type="button"]:hover, html:not(.dark) input[type="submit"]:hover, html:not(.dark) input[type="reset"]:hover {
            background-color: #e2e6ea; border-color: #dae0e5;
          }
          html:not(.dark) code { color: #c7254e; background-color: #f9f2f4; }
          html:not(.dark) pre { background-color: #f5f5f5; border-color: #ccc; color: #333; }

          /* Dark theme styles */
          html.dark body { color: #ccc; background-color: #1e1e1e; }
          html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark h6 { color: #eee; }
          html.dark a { color: #58a6ff; }
          html.dark th, html.dark td { border-color: #444; }
          html.dark th { background-color: #2a2a2a; }
          html.dark button, html.dark input[type="button"], html.dark input[type="submit"], html:not(.dark) input[type="reset"] {
            color: #c9d1d9; background-color: #21262d; border-color: #30363d;
          }
          html.dark button:hover, html.dark input[type="button"]:hover, html.dark input[type="submit"]:hover, html.dark input[type="reset"]:hover {
            background-color: #30363d; border-color: #8b949e;
          }
          html.dark code { color: #ff7b72; background-color: #2d2d2d; }
          html.dark pre { background-color: #2c2c2c; border-color: #444; color: #ccc; }

          /* Other shared styles */
          h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; }
          p { margin-bottom: 1em; }
          a { text-decoration: none; }
          a:hover { text-decoration: underline; }
          ul, ol { margin-bottom: 1em; padding-left: 20px; }
          li { margin-bottom: 0.25em; }
          img { max-width: 100%; height: auto; border-radius: 4px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
          th, td { border: 1px solid; padding: 8px; text-align: left; } /* border-color set by theme */
          button, input[type="button"], input[type="submit"], input[type="reset"] {
            display: inline-block; padding: 8px 15px; font-size: 14px; font-weight: 500; line-height: 1.5;
            border: 1px solid; border-radius: 4px; cursor: pointer;
            transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          }
          code { padding: 2px 4px; font-size: 90%; border-radius: 4px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; }
          pre { display: block; padding: 9.5px; margin: 0 0 10px; font-size: 13px; line-height: 1.42857143; word-break: break-all; word-wrap: break-word; border: 1px solid; border-radius: 4px; overflow: auto; }
          pre code { padding: 0; font-size: inherit; color: inherit; background-color: transparent; border-radius: 0; }
        </style>
        ${aiStylesString}
      </head>
      <body>
        ${aiBodyContent}
      </body>
      </html>
    `;
  }, [editableCode, currentTheme]);

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
          <div className="flex items-center gap-1">
            <Button
              onClick={() =>
                setViewMode(viewMode === 'preview' ? 'code' : 'preview')
              }
              variant="ghost"
              size="sm"
              className="text-xs px-2 py-1 h-auto text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200"
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
                  className="text-xs px-2 py-1 h-auto text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={copied ? 'Code copied' : 'Copy code'}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                {hasEdited && (
                  <>
                    <Button
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Reset code"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        setAppliedHtmlContent(editableCode); // Apply changes to the iframe
                        setHasEdited(false); // Reset hasEdited after applying
                      }}
                      variant="default" // Use default variant for prominence
                      size="sm"
                      className="text-xs px-2 py-1 h-auto bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
                      aria-label="Apply changes"
                    >
                      Apply Changes
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              onClick={toggleMaximize}
              variant="ghost"
              size="sm"
              className="px-2 py-1 h-auto text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={isMaximized ? 'Minimize preview' : 'Maximize preview'}
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
          <div className="relative flex-1 overflow-hidden">
            {isLoadingIframe && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Loading preview...
              </div>
            )}
            <iframe
              key={appliedHtmlContent} // Add key to force re-render on content change
              ref={iframeRef}
              srcDoc={getIframeSrcDoc()}
              title={title}
              sandbox="allow-scripts" // Removed allow-same-origin for enhanced security
              className="w-full h-full border-0"
              style={{ height: isMaximized ? '100%' : '300px' }} // Fixed height when not maximized
              onLoad={() => setIsLoadingIframe(false)} // Set loading to false when iframe loads
            />
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto bg-black p-3"
            style={{ height: isMaximized ? '100%' : '300px' }} // Give code view a fixed 300px height when not maximized
          >
            <Editor
              value={editableCode}
              onValueChange={(code) => {
                setEditableCode(code);
                setHasEdited(true);
              }}
              highlight={(code) =>
                Prism.highlight(code, Prism.languages.markup, 'markup')
              }
              padding={10}
              className="text-xs font-mono rounded-md focus-within:ring-2 focus-within:ring-blue-500"
              style={{
                minHeight: '100%', // Ensure editor takes full height of its container
                outline: 'none',
                backgroundColor: '#282a36', // Dracula background
                color: '#f8f8f2', // Dracula foreground
                fontFamily: '"JetBrains Mono", monospace', // JetBrains Mono font
                border: '1px solid #44475a', // Dracula border color
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
