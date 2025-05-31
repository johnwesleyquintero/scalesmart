import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // Or any other style you prefer

interface JsonViewerProps {
  jsonContent: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ jsonContent }) => {
  let formattedJson = jsonContent;
  try {
    // Attempt to parse and re-stringify to ensure pretty printing
    formattedJson = JSON.stringify(JSON.parse(jsonContent), null, 2);
  } catch (e) {
    // If parsing fails, it's not valid JSON, so display as is.
    console.warn('Invalid JSON content provided to JsonViewer:', e);
  }

  return (
    <div className="json-viewer-container my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <SyntaxHighlighter
        language="json"
        style={vs2015} // Using vs2015 theme for dark background, adjust as needed
        showLineNumbers={true}
        wrapLines={true}
        customStyle={{
          padding: '1rem',
          margin: 0,
          fontSize: '0.875rem', // text-sm
          lineHeight: '1.25rem', // leading-5
          backgroundColor: 'var(--code-block-background)', // Use CSS variable for theme consistency
          color: 'var(--code-block-foreground)',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono)', // Use a monospace font
          },
        }}
      >
        {formattedJson}
      </SyntaxHighlighter>
    </div>
  );
};

export default JsonViewer;
