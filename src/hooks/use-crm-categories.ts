import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/indexeddb-service';
import { useCategoryManagement } from './use-category-management';

export const useCrmCategories = () => {
  const dbFunctions = {
    getAll: getAllCategories,
    add: addCategory,
    update: updateCategory,
    delete: deleteCategory,
  };

  const {
    categories,
    isLoading,
    error,
    addCategory: handleAddCategoryAction,
    updateCategory: handleUpdateCategoryAction,
    deleteCategory: handleDeleteCategoryAction,
  } = useCategoryManagement(dbFunctions, 'crmCategories');

  return {
    categories,
    isLoading,
    error,
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
  };
};
