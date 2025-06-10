'use client';

import React, { useEffect } from 'react'; // Removed useMemo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownCategoryManager from './MarkdownCategoryManager';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
// Removed Note import and getAllNotes import

export const MarkdownCategoryManagementTab: React.FC = () => {
  const {
    allCategories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    fetchCategories,
    getNoteCountsByCategory, // Import the new function
  } = useMarkdownNotepadContext();
  // Removed notes state

  // This callback is for when a category is renamed.
  // We need to trigger a reload of categories to ensure UI is updated.
  // Note counts will be handled by MarkdownCategoryManager using the context function.
  const handleCategoryRenamed = async (oldName: string, newName: string) => {
    await fetchCategories(); // Re-fetch categories to ensure UI is updated
    // Removed fetchAllNotes
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
          getNoteCountsByCategory={getNoteCountsByCategory} // Pass the new function
        />
      </CardContent>
    </Card>
  );
};
