import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/types/indexeddb';

interface CategoryDbFunctions {
  getAll: () => Promise<Category[]>;
  add: (category: { name: string }) => Promise<Category | string>; // Can return Category or string ID
  update: (category: Category) => Promise<void>; // Returns void
  delete: (id: string) => Promise<void>;
  getCounts?: () => Promise<Map<string, number>>;
}

export const useCategoryManagement = (
  db: CategoryDbFunctions,
  queryKey: string,
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    error: errorCategories,
  } = useQuery<Category[], Error>({
    queryKey: [queryKey],
    queryFn: db.getAll,
  });

  const {
    data: counts = new Map(),
    isLoading: isLoadingCounts,
    error: errorCounts,
  } = useQuery<Map<string, number>, Error>({
    queryKey: [`${queryKey}Counts`],
    queryFn: db.getCounts || (() => Promise.resolve(new Map())),
    enabled: !!db.getCounts,
  });

  const addCategoryMutation = useMutation<
    Category | string,
    Error,
    string,
    unknown
  >({
    mutationFn: (name: string) => db.add({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [`${queryKey}Counts`] });
      toast({
        title: 'Success',
        description: 'Category added.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add category.',
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation<void, Error, Category>({
    mutationFn: (category: Category) => db.update(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [`${queryKey}Counts`] });
      toast({
        title: 'Success',
        description: 'Category updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category.',
        variant: 'destructive',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => db.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [`${queryKey}Counts`] });
      toast({
        title: 'Success',
        description: 'Category deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category.',
        variant: 'destructive',
      });
    },
  });

  return {
    categories,
    counts,
    isLoading: isLoadingCategories || isLoadingCounts,
    error: errorCategories || errorCounts,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
  };
};
