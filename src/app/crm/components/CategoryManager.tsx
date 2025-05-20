'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Import Card components
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
}

const CategoryManager = ({
  onCategoriesUpdate,
  initialCategories,
  onCategorySuccessfullyDeleted,
  onCategoryRenamed,
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories. See console for details.');
      }
    };

    loadCategories();
  }, []); // Still load initially for its own display, parent will also load

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
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
    <div className="card flex-1">
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
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
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </div>
  );
};

export default CategoryManager;
