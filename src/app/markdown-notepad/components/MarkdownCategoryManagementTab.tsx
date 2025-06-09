'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownCategoryManager from './MarkdownCategoryManager';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import { Note } from '@/types/indexeddb';
import { getAllNotes } from '@/lib/indexeddb/markdown-notepad-db'; // Import getAllNotes

export const MarkdownCategoryManagementTab: React.FC = () => {
  const {
    allCategories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    fetchCategories,
  } = useMarkdownNotepadContext();
  const [notes, setNotes] = useState<Note[]>([]);

  const fetchAllNotes = async () => {
    try {
      const fetchedNotes = await getAllNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error(
        'Failed to fetch all notes for category management:',
        error,
      );
    }
  };

  useEffect(() => {
    fetchAllNotes();
  }, []); // Fetch notes on component mount

  // This callback is for when a category is renamed.
  // We need to trigger a reload of notes in the parent component (page.tsx)
  // to reflect the category name changes in the note list.
  const handleCategoryRenamed = async (oldName: string, newName: string) => {
    await fetchCategories(); // Re-fetch categories to ensure UI is updated
    await fetchAllNotes(); // Re-fetch notes to reflect category name changes
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-foreground">
          Manage Note Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownCategoryManager
          categories={allCategories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onCategoryRenamed={handleCategoryRenamed}
        />
      </CardContent>
    </Card>
  );
};
