/**
 * @file use-crm-categories.ts
 * @description Custom React hook for managing CRM categories data.
 * It handles data loading, saving, updating, and deleting operations with IndexedDB
 * and provides state management for the CRM application.
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/indexeddb-service';
import type { Category } from '@/app/crm/types';

const LOAD_DATA_ERROR =
  'Failed to load categories. Please check console for details.';
const ADD_CATEGORY_ERROR = 'Failed to add category. Please try again.';
const UPDATE_CATEGORY_ERROR = 'Failed to update category. Please try again.';
const DELETE_CATEGORY_ERROR = 'Failed to delete category. Please try again.';

export const useCrmCategories = () => {
  // State to store the list of categories.
  const [categories, setCategories] = useState<Category[]>([]);

  /**
   * useEffect hook to load initial category data from IndexedDB
   * when the component mounts. This ensures data persistence across sessions.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch all categories.
        const allCategories = await getAllCategories();
        setCategories(allCategories);
      } catch (error: unknown) {
        console.error('Error loading categories from IndexedDB:', error);
        toast.error(`${LOAD_DATA_ERROR} ${(error as Error).message || error}`);
      }
    };
    loadInitialData();
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  /**
   * Handles adding a new category.
   * Calls the IndexedDB service and updates the state.
   */
  const handleAddCategoryAction = useCallback(async (name: string) => {
    try {
      // The IndexedDB service handles ID generation
      const newId = await addCategory({ name });
      if (newId) {
        const newCategory: Category = { id: newId, name };
        setCategories((prevCategories) => [...prevCategories, newCategory]);
        toast.success('Category added successfully!');
      } else {
        toast.error(
          'Failed to add category. Please check console for details.',
        );
      }
    } catch (error: unknown) {
      console.error('Error adding category:', error);
      toast.error(`${ADD_CATEGORY_ERROR} ${(error as Error).message || error}`);
    }
  }, []); // Dependency array is empty as it uses setCategories functional update

  /**
   * Handles updating an existing category.
   * Calls the IndexedDB service and updates the state.
   */
  const handleUpdateCategoryAction = useCallback(async (category: Category) => {
    try {
      await updateCategory(category);
      setCategories((prevCategories) =>
        prevCategories.map((cat) => (cat.id === category.id ? category : cat)),
      );
      toast.success('Category updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating category:', error);
      toast.error(
        `${UPDATE_CATEGORY_ERROR} ${(error as Error).message || error}`,
      );
    }
  }, []); // Dependency array is empty as it uses setCategories functional update

  /**
   * Handles deleting a category.
   * Calls the IndexedDB service and updates the state.
   */
  const handleDeleteCategoryAction = useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prevCategories) =>
        prevCategories.filter((cat) => cat.id !== id),
      );
      toast.success('Category deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting category:', error);
      toast.error(
        `${DELETE_CATEGORY_ERROR} ${(error as Error).message || error}`,
      );
    }
  }, []); // Dependency array is empty as it uses setCategories functional update

  return {
    categories,
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
  };
};
