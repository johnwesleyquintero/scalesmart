import { toast } from 'sonner';
import type { Category } from '../types';

/**
 * Validates a category name for adding or updating.
 * @param name The category name to validate.
 * @param categories The list of existing categories.
 * @param editingId Optional ID of the category being edited.
 * @returns True if the name is valid, false otherwise.
 */
export const validateCategoryName = (
  name: string,
  categories: Category[],
  editingId?: string,
): boolean => {
  if (!name) {
    toast.error('Category name cannot be empty.');
    return false;
  }

  const categoryExists = categories.some(
    (category) =>
      category.id !== editingId &&
      category.name.toLowerCase() === name.toLowerCase(),
  );

  if (categoryExists) {
    toast.error(`Category "${name}" already exists.`);
    return false;
  }

  return true;
};

/**
 * Checks if a category can be deleted based on customer counts.
 * @param categoryName The name of the category to check.
 * @param customerCounts The map of category names to customer counts.
 * @returns True if the category can be deleted, false otherwise.
 */
export const canDeleteCategory = (
  categoryName: string,
  customerCounts: Map<string | null, number>,
): boolean => {
  const count = customerCounts.get(categoryName) || 0;
  if (count > 0) {
    toast.error(
      `Cannot delete category "${categoryName}" because ${count} customer(s) are assigned to it.`,
    );
    return false;
  }
  return true;
};
