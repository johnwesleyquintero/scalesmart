'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAllNotes, addNote } from '@/lib/indexeddb/markdown-notepad-db';
import { Note } from '@/types/indexeddb';
import { v4 as uuidv4 } from 'uuid';

const ImportExportButtons: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportNotes = async () => {
    try {
      const notes = await getAllNotes();
      if (notes.length === 0) {
        toast({
          title: 'No Notes to Export',
          description: 'There are no notes in your notepad to export.',
          variant: 'destructive',
        });
        return;
      }

      const dataStr = JSON.stringify(notes, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scalesmart_markdown_notes_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Notes Exported',
        description:
          'Your notes have been successfully exported as a JSON file.',
      });
    } catch (error) {
      console.error('Error exporting notes:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your notes.',
        variant: 'destructive',
      });
    }
  };

  const handleImportNotes = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JSON file for import.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importedNotes: Note[] = JSON.parse(content);

          if (!Array.isArray(importedNotes)) {
            throw new Error('Invalid JSON format: Expected an array of notes.');
          }

          let importedCount = 0;
          for (const note of importedNotes) {
            // Basic validation for note structure
            if (note.title && note.markdown && note.category) {
              // Generate a new ID to avoid conflicts with existing notes
              const newNoteId = uuidv4();
              await addNote(note.title, note.markdown, note.category);
              importedCount++;
            } else {
              console.warn('Skipping malformed note during import:', note);
            }
          }

          toast({
            title: 'Import Complete',
            description: `${importedCount} notes have been successfully imported.`,
          });
        } catch (parseError) {
          console.error('Error parsing imported file:', parseError);
          toast({
            title: 'Import Failed',
            description: `Error processing file: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format.'}`,
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Import Failed',
        description: 'There was an error reading the file.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex space-x-2">
      <Button onClick={handleImportNotes} variant="outline">
        Import Notes (JSON)
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <Button onClick={handleExportNotes} variant="outline">
        Export Notes (JSON)
      </Button>
    </div>
  );
};

export default ImportExportButtons;
