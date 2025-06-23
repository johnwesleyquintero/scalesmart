import React from 'react';
import ReactMarkdown from 'react-markdown';

interface TextWidgetProps {
  id: string;
  content: string; // Content can be plain text or markdown
}

const TextWidget: React.FC<TextWidgetProps> = ({ id, content }) => {
  return (
    <div className="p-4 border rounded shadow">
      <h3>Text Widget</h3>
      {content ? (
        <ReactMarkdown data-testid="text-widget-content">
          {content}
        </ReactMarkdown>
      ) : (
        <p data-testid="text-widget-content">No content</p>
      )}
    </div>
  );
};

export default TextWidget;
