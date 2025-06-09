'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownCategoryManager from './MarkdownCategoryManager';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import { Note } from '@/types/indexeddb'; // Import Note type

interface MarkdownCategoryManagementTabProps {
  notes: Note[]; // Pass notes to calculate note counts per category
}

export const MarkdownCategoryManagementTab: React.FC<
  MarkdownCategoryManagementTabProps
> = ({ notes }) => {
  const {
    allCategories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    fetchCategories,
  } = useMarkdownNotepadContext();

  // This callback is for when a category is renamed.
  // We need to trigger a reload of notes in the parent component (page.tsx)
  // to reflect the category name changes in the note list.
  const handleCategoryRenamed = async (oldName: string, newName: string) => {
    // In a real application, you might want to update notes in IndexedDB
    // that still reference the old category name. For this implementation,
    // we'll rely on the notes being reloaded from the database, which will
    // pick up the updated category names from the notes themselves.
    // The `updateNote` function in `markdown-notepad-db.ts` already ensures
    // the category exists, so if a note's category is changed, it will
    // implicitly update the category in the notes object store.
    // We just need to ensure the notes list is refreshed.
    await fetchCategories(); // Re-fetch categories to ensure UI is updated
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
          notes={notes}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onCategoryRenamed={handleCategoryRenamed}
        />
      </CardContent>
    </Card>
  );
};
