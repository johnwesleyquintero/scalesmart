import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/indexeddb';
import { useToast } from '@/hooks/use-toast';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getNoteCountsByCategory as dbGetNoteCountsByCategory,
} from '@/lib/indexeddb/markdown-notepad-db';

interface UseCategoryManagementResult {
  categories: Category[];
  noteCounts: Map<string, number>;
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  handleAddCategory: (name: string) => Promise<void>;
  handleUpdateCategory: (category: Category) => Promise<void>;
  handleDeleteCategory: (id: string) => Promise<void>;
  getNoteCountsByCategory: () => Promise<Map<string, number>>;
}

export const useCategoryManagement = (): UseCategoryManagementResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [noteCounts, setNoteCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories);
    } catch (err: unknown) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories.');
      toast({
        title: 'Error',
        description: 'Failed to load categories.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchNoteCounts = useCallback(async (): Promise<
    Map<string, number>
  > => {
    try {
      const counts = await dbGetNoteCountsByCategory();
      setNoteCounts(counts);
      return counts;
    } catch (err: unknown) {
      console.error('Failed to fetch note counts:', err);
      toast({
        title: 'Error',
        description: 'Failed to load note counts.',
        variant: 'destructive',
      });
      return new Map();
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
    fetchNoteCounts();
  }, [fetchCategories, fetchNoteCounts]);

  const handleAddCategory = useCallback(
    async (name: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const newCategory: Category = await addCategory({ name });
        setCategories((prev: Category[]) => [...prev, newCategory]);
        await fetchNoteCounts();
        toast({
          title: 'Success',
          description: `Category "${name}" added.`,
        });
      } catch (err: unknown) {
        console.error('Failed to add category:', err);
        let errorMessage = 'Failed to add category.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchNoteCounts, toast],
  );

  const handleUpdateCategory = useCallback(
    async (category: Category) => {
      setIsLoading(true);
      setError(null);
      try {
        await updateCategory(category);
        setCategories((prev) =>
          prev.map((cat) => (cat.id === category.id ? category : cat)),
        );
        await fetchNoteCounts();
        toast({
          title: 'Success',
          description: `Category "${category.name}" updated.`,
        });
      } catch (err: unknown) {
        console.error('Failed to update category:', err);
        let errorMessage = 'Failed to update category.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchNoteCounts, toast],
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await deleteCategory(id);
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        await fetchNoteCounts();
        toast({
          title: 'Success',
          description: 'Category deleted.',
        });
      } catch (err: unknown) {
        console.error('Failed to delete category:', err);
        let errorMessage = 'Failed to delete category.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchNoteCounts, toast],
  );

  return {
    categories,
    noteCounts,
    isLoading,
    error,
    fetchCategories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    getNoteCountsByCategory: fetchNoteCounts,
  };
};
