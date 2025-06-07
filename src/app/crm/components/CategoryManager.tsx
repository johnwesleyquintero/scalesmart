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
// Removed direct IndexedDB imports
import type { Category } from '../types';
import { toast } from 'sonner';

/**
 * Props for the CategoryManager component.
 */
interface CategoryManagerProps {
  categories: Category[]; // List of all available categories passed from parent.
  onAddCategory: (name: string) => Promise<void>; // Callback to add a new category.
  onUpdateCategory: (category: Category) => Promise<void>; // Callback to update an existing category.
  onDeleteCategory: (id: string) => Promise<void>; // Callback to delete a category.
  onCategorySuccessfullyDeleted: (deletedCategoryName: string) => void; // Callback when a category is successfully deleted (for parent state update).
  onCategoryRenamed: (oldName: string, newName: string) => void; // Callback when a category is renamed (for parent state update).
  customerCounts: Map<string | null, number>; // Map of category names to customer counts.
}

/**
 * CategoryManager component.
 * Manages the state and operations for categories.
 */
const CategoryManager = ({
  categories, // Use categories prop directly
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCategorySuccessfullyDeleted,
  onCategoryRenamed,
  customerCounts,
}: CategoryManagerProps) => {
  // State for the input field where new or edited category names are entered.
  const [categoryInputName, setCategoryInputName] = useState('');
  // State to hold the category currently being edited, or null if not editing.
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  /**
   * Effect to populate the input field when editingCategory changes.
   */
  useEffect(() => {
    if (editingCategory) {
      setCategoryInputName(editingCategory.name);
    } else {
      setCategoryInputName('');
    }
  }, [editingCategory]);

  /**
   * Handles adding a new category.
   * Validates input and calls the parent's add handler.
   */
  const handleAddCategory = async () => {
    const trimmedCategoryName = categoryInputName.trim();

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

    // Call the parent's add category action
    await onAddCategory(trimmedCategoryName);
    // Parent will update the categories state and pass it back down
    setCategoryInputName(''); // Clear input field.
  };

  /**
   * Sets the state for editing a category.
   * Populates the input field with the category's current name.
   */
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryInputName(category.name);
  };

  /**
   * Handles updating an existing category.
   * Validates input, checks for duplicates (excluding itself), and calls the parent's update handler.
   */
  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      toast.error('No category selected for update.');
      return;
    }

    const trimmedCategoryName = categoryInputName.trim();

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

    // Call the parent's update category action
    await onUpdateCategory(updatedCategory);
    // Parent will update the categories state and pass it back down

    setEditingCategory(null); // Clear editing state.
    setCategoryInputName(''); // Clear input field.

    // If the name actually changed, notify the parent.
    if (oldName !== updatedCategory.name) {
      onCategoryRenamed(oldName, updatedCategory.name);
    }
  };

  /**
   * Handles deleting a category.
   * Prevents deletion if customers are associated with it and calls the parent's delete handler.
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

    // Call the parent's delete category action
    await onDeleteCategory(id);
    // Parent will update the categories state and pass it back down
    onCategorySuccessfullyDeleted(categoryToDelete.name); // Notify parent about the specific category deleted.
  };

  // Determine if the add/update button should be disabled.
  const isButtonDisabled = categoryInputName.trim() === '';

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-foreground">Category Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="category-input-name">Category Name</Label>
            <Input
              type="text"
              id="category-input-name"
              value={categoryInputName}
              onChange={(e) => setCategoryInputName(e.target.value)}
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
                    setCategoryInputName(''); // Clear input field.
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
