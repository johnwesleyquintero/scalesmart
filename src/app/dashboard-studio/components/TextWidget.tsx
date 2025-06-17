import React from 'react';

interface TextWidgetProps {
  id: string;
  content: string; // Content can be plain text or markdown
}

const TextWidget: React.FC<TextWidgetProps> = ({ id, content }) => {
  // Basic implementation for now, can integrate a markdown renderer later
  return (
    <div className="p-4 border rounded shadow">
      <h3>Text Widget</h3>
      <p>{content}</p>
    </div>
  );
};

export default TextWidget;
