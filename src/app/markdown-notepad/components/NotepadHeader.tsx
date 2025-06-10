import React from 'react';

const NotepadHeader: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2 text-center">
        Markdown Notepad Dashboard
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Manage your notes, categories, and search through your markdown content.
      </p>
    </>
  );
};

export default NotepadHeader;
