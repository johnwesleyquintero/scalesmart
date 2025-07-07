'use client';

import React, { useEffect } from 'react'; // Removed useMemo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownCategoryManager from './MarkdownCategoryManager';
import { useCategoryManagement } from '@/hooks/use-category-management';
import {
  getAllCategories,
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  getNoteCountsByCategory,
} from '@/lib/indexeddb/markdown-notepad-db';

export const MarkdownCategoryManagementTab: React.FC = () => {
  const dbFunctions = {
    getAll: getAllCategories,
    add: dbAddCategory,
    update: dbUpdateCategory,
    delete: dbDeleteCategory,
    getCounts: getNoteCountsByCategory,
  };

  const {
    categories: allCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    counts,
  } = useCategoryManagement(dbFunctions, 'markdownCategories');
  // Removed notes state

  // This callback is for when a category is renamed.
  // We need to trigger a reload of categories to ensure UI is updated.
  // Note counts will be handled by MarkdownCategoryManager using the context function.
  const handleCategoryRenamed = async () => {
    // The new useCategoryManagement hook handles re-fetching internally on mutations.
    // If a manual re-fetch is needed for external reasons, it would be handled by invalidating the query client.
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
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onCategoryRenamed={handleCategoryRenamed}
          noteCounts={counts}
        />
      </CardContent>
    </Card>
  );
};
