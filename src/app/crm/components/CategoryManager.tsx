'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Import Card components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} from '@/lib/indexeddb';
import type { Category } from '../types';
import { toast } from 'sonner';

interface CategoryManagerProps {
  onCategoriesUpdate: (updatedCategories: Category[]) => void;
  initialCategories: Category[];
  onCategorySuccessfullyDeleted: (deletedCategoryName: string) => void;
  onCategoryRenamed: (oldName: string, newName: string) => void; // New prop
  customerCounts: Map<string | null, number>; // New prop for customer counts
}

const CategoryManager = ({
  onCategoriesUpdate,
  initialCategories,
  onCategorySuccessfullyDeleted,
  onCategoryRenamed,
  customerCounts, // Destructure the new prop
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);
  const handleAddCategory = async () => {
    const trimmedCategoryName = newCategoryName.trim();
    if (!trimmedCategoryName) {
      return;
    }

    // Check if a category with the same name already exists (case-insensitive)
    const categoryExists = categories.some(
      (category) => category.name.toLowerCase() === trimmedCategoryName.toLowerCase()
    );

    if (categoryExists) {
      toast.error(`Category "${trimmedCategoryName}" already exists.`);
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: trimmedCategoryName,
    };

    try {
      await addCategory(newCategory);
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      setNewCategoryName('');
      onCategoriesUpdate(updatedCategories);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. See console for details.');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      return;
    }
    const oldName = editingCategory.name; // Capture old name before update

    const updatedCategory: Category = {
      ...editingCategory,
      name: newCategoryName.trim(),
    };

    try {
      const newName = updatedCategory.name; // Capture new name
      await updateCategory(updatedCategory);
      const updatedCategories = categories.map((category) =>
        category.id === updatedCategory.id ? updatedCategory : category,
      );
      setCategories(updatedCategories);
      setEditingCategory(null);
      setNewCategoryName('');
      onCategoriesUpdate(updatedCategories);
      if (oldName !== newName) {
        onCategoryRenamed(oldName, newName); // Notify parent specifically about the rename
      }
      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category. See console for details.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const categoryToDelete = categories.find((cat) => cat.id === id);
      if (!categoryToDelete) {
        toast.error('Category not found for deletion.');
        return;
      }
      const deletedCategoryName = categoryToDelete.name;

      await deleteCategory(id);
      const updatedCategories = categories.filter(
        (category) => category.id !== id,
      );
      setCategories(updatedCategories);
      onCategoriesUpdate(updatedCategories);
      onCategorySuccessfullyDeleted(deletedCategoryName); // Notify parent about the specific category deleted
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category. See console for details.');
    }
  };

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
            />
          </div>
          <div className="flex items-end justify-end space-x-2">
            {' '}
            {/* Added space-x-2 for button spacing */}
            {editingCategory ? (
              // In Edit Mode: Show Cancel and Update buttons
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null); // Clear editing state
                    setNewCategoryName(''); // Clear input field
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory}>Update Category</Button>
              </>
            ) : (
              // In Add Mode: Show Add Category button
              <Button onClick={handleAddCategory}>Add Category</Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          {' '}
          {/* Added margin-top for spacing */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Customers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-center">
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                      {customerCounts.get(category.name) || 0}
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
                    </Button>{' '}
                    {/* Added margin-right */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                <TableCell className="text-right"></TableCell>{' '}
                {/* Empty cell for actions */}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
