import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/indexeddb/markdown-notepad-db';
import type { Category } from '@/types/indexeddb';

const LOAD_DATA_ERROR =
  'Failed to load categories. Please check console for details.';
const ADD_CATEGORY_ERROR = 'Failed to add category. Please try again.';
const UPDATE_CATEGORY_ERROR = 'Failed to update category. Please try again.';
const DELETE_CATEGORY_ERROR = 'Failed to delete category. Please try again.';

export const useMarkdownCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error: unknown) {
      console.error('Error loading categories from IndexedDB:', error);
      toast.error(`${LOAD_DATA_ERROR} ${(error as Error).message || error}`);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategoryAction = useCallback(async (name: string) => {
    try {
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
      throw error; // Re-throw to allow calling component to handle
    }
  }, []);

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
      throw error; // Re-throw to allow calling component to handle
    }
  }, []);

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
      throw error; // Re-throw to allow calling component to handle
    }
  }, []);

  return {
    categories,
    fetchCategories, // Expose fetchCategories to allow manual refresh
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
  };
};
