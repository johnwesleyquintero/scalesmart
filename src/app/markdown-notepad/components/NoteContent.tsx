'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteContentProps {
  markdown: string;
}

const NoteContent: React.FC<NoteContentProps> = ({ markdown }) => {
  return (
    <div className="border rounded-md p-4 overflow-y-auto min-h-[300px] prose dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

export default NoteContent;
