import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getNoteCountsByCategory,
} from '@/lib/indexeddb/markdown-notepad-db';
import { useCategoryManagement } from './use-category-management';

export const useMarkdownCategories = () => {
  const dbFunctions = {
    getAll: getAllCategories,
    add: addCategory,
    update: updateCategory,
    delete: deleteCategory,
    getCounts: getNoteCountsByCategory,
  };

  const {
    categories,
    counts,
    isLoading,
    error,
    addCategory: handleAddCategoryAction,
    updateCategory: handleUpdateCategoryAction,
    deleteCategory: handleDeleteCategoryAction,
  } = useCategoryManagement(dbFunctions, 'markdownCategories');

  return {
    categories,
    noteCounts: counts,
    isLoading,
    error,
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
  };
};
