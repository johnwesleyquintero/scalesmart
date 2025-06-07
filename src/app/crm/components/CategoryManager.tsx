'use client';

/**
 * @file CategoryManager.tsx
 * @description This component provides the core logic and UI for managing categories.
 * It allows users to add, edit, and delete categories, and displays the number of customers
 * associated with each category. It interacts with IndexedDB for data persistence.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { addCategory, updateCategory, deleteCategory } from '@/lib/indexeddb'; // Removed getAllCategories as it's not used directly here
import type { Category } from '../types';
import { toast } from 'sonner';

/**
 * Props for the CategoryManager component.
 */
interface CategoryManagerProps {
  onCategoriesUpdate: (updatedCategories: Category[]) => void; // Callback to notify parent of category changes.
  initialCategories: Category[]; // Initial list of categories passed from parent.
  onCategorySuccessfullyDeleted: (deletedCategoryName: string) => void; // Callback when a category is deleted.
  onCategoryRenamed: (oldName: string, newName: string) => void; // Callback when a category is renamed.
  customerCounts: Map<string | null, number>; // Map of category names to customer counts.
}

/**
 * CategoryManager component.
 * Manages the state and operations for categories.
 */
const CategoryManager = ({
  onCategoriesUpdate,
  initialCategories,
  onCategorySuccessfullyDeleted,
  onCategoryRenamed,
  customerCounts,
}: CategoryManagerProps) => {
  // State for the list of categories managed by this component.
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  // State for the input field where new or edited category names are entered.
  const [newCategoryName, setNewCategoryName] = useState('');
  // State to hold the category currently being edited, or null if not editing.
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  /**
   * Effect to synchronize internal `categories` state with `initialCategories` prop.
   * This is crucial if `initialCategories` are fetched asynchronously by the parent.
   */
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  /**
   * Handles adding a new category.
   * Validates input, checks for duplicates, and persists to IndexedDB.
   */
  const handleAddCategory = async () => {
    const trimmedCategoryName = newCategoryName.trim();

    // Prevent adding empty category names.
    if (!trimmedCategoryName) {
      toast.error('Category name cannot be empty.');
      return;
    }

    // Check for case-insensitive uniqueness.
    const categoryExists = categories.some(
      (category) =>
        category.name.toLowerCase() === trimmedCategoryName.toLowerCase(),
    );

    if (categoryExists) {
      toast.error(`Category "${trimmedCategoryName}" already exists.`);
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(), // Simple unique ID generation.
      name: trimmedCategoryName,
    };

    try {
      await addCategory(newCategory);
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      setNewCategoryName(''); // Clear input field.
      onCategoriesUpdate(updatedCategories); // Notify parent.
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. Please try again.');
    }
  };

  /**
   * Sets the state for editing a category.
   * Populates the input field with the category's current name.
   */
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  /**
   * Handles updating an existing category.
   * Validates input, checks for duplicates (excluding itself), and persists to IndexedDB.
   */
  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      toast.error('No category selected for update.');
      return;
    }

    const trimmedCategoryName = newCategoryName.trim();

    // Prevent updating with an empty category name.
    if (!trimmedCategoryName) {
      toast.error('Category name cannot be empty.');
      return;
    }

    // Check for case-insensitive uniqueness, excluding the category being edited.
    const categoryExists = categories.some(
      (category) =>
        category.id !== editingCategory.id &&
        category.name.toLowerCase() === trimmedCategoryName.toLowerCase(),
    );

    if (categoryExists) {
      toast.error(`Category "${trimmedCategoryName}" already exists.`);
      return;
    }

    const oldName = editingCategory.name; // Capture old name before update.
    const updatedCategory: Category = {
      ...editingCategory,
      name: trimmedCategoryName,
    };

    try {
      await updateCategory(updatedCategory);
      const updatedCategories = categories.map((category) =>
        category.id === updatedCategory.id ? updatedCategory : category,
      );
      setCategories(updatedCategories);
      setEditingCategory(null); // Clear editing state.
      setNewCategoryName(''); // Clear input field.
      onCategoriesUpdate(updatedCategories); // Notify parent.

      // If the name actually changed, notify the parent.
      if (oldName !== updatedCategory.name) {
        onCategoryRenamed(oldName, updatedCategory.name);
      }
      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category. Please try again.');
    }
  };

  /**
   * Handles deleting a category.
   * Prevents deletion if customers are associated with it.
   */
  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === id);
    if (!categoryToDelete) {
      toast.error('Category not found for deletion.');
      return;
    }

    // Prevent deletion if customers are assigned to this category.
    const count = customerCounts.get(categoryToDelete.name) || 0;
    if (count > 0) {
      toast.error(
        `Cannot delete category "${categoryToDelete.name}" because ${count} customer(s) are assigned to it.`,
      );
      return;
    }

    try {
      const deletedCategoryName = categoryToDelete.name;
      await deleteCategory(id);
      const updatedCategories = categories.filter(
        (category) => category.id !== id,
      );
      setCategories(updatedCategories);
      onCategoriesUpdate(updatedCategories); // Notify parent.
      onCategorySuccessfullyDeleted(deletedCategoryName); // Notify parent about the specific category deleted.
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category. Please try again.');
    }
  };

  // Determine if the add/update button should be disabled.
  const isButtonDisabled = newCategoryName.trim() === '';

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-foreground">Category Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="new-category-name">Category Name</Label>
            <Input
              type="text"
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>
          <div className="flex items-end justify-end space-x-2">
            {editingCategory ? (
              // In Edit Mode: Show Cancel and Update buttons
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null); // Clear editing state.
                    setNewCategoryName(''); // Clear input field.
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCategory}
                  disabled={isButtonDisabled}
                >
                  Update Category
                </Button>
              </>
            ) : (
              // In Add Mode: Show Add Category button
              <Button onClick={handleAddCategory} disabled={isButtonDisabled}>
                Add Category
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Customers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const customerCount = customerCounts.get(category.name) || 0;
                const canDelete = customerCount === 0; // Can only delete if no customers are assigned.

                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                        {customerCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEditCategory(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={!canDelete} // Disable delete button if customers are assigned.
                        title={
                          !canDelete
                            ? `Cannot delete: ${customerCount} customer(s) assigned.`
                            : 'Delete category'
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Row for Uncategorized customers count */}
              <TableRow>
                <TableCell className="font-medium italic text-muted-foreground">
                  Uncategorized
                </TableCell>
                <TableCell className="text-center">
                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                    {customerCounts.get(null) || 0}
                  </span>
                </TableCell>
                <TableCell className="text-right"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
