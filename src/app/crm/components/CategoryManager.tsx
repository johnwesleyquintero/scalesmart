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
import type { Category } from '../types';
import { toast } from 'sonner';
import {
  validateCategoryName,
  canDeleteCategory,
} from '../utils/categoryUtils';

/**
 * Props for the CategoryManager component.
 */
interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | string | void>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCategorySuccessfullyDeleted: (deletedCategoryName: string) => void;
  onCategoryRenamed: (oldName: string, newName: string) => void;
  customerCounts: Map<string | null, number>;
}

const CategoryManager = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCategorySuccessfullyDeleted,
  onCategoryRenamed,
  customerCounts,
}: CategoryManagerProps) => {
  const [categoryInputName, setCategoryInputName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setCategoryInputName(editingCategory.name);
    } else {
      setCategoryInputName('');
    }
  }, [editingCategory]);

  const handleAddCategory = async () => {
    const trimmedCategoryName = categoryInputName.trim();
    if (!validateCategoryName(trimmedCategoryName, categories)) return;

    await onAddCategory(trimmedCategoryName);
    setCategoryInputName('');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryInputName(category.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      toast.error('No category selected for update.');
      return;
    }

    const trimmedCategoryName = categoryInputName.trim();
    if (
      !validateCategoryName(trimmedCategoryName, categories, editingCategory.id)
    )
      return;

    const oldName = editingCategory.name;
    const updatedCategory: Category = {
      ...editingCategory,
      name: trimmedCategoryName,
    };

    await onUpdateCategory(updatedCategory);

    setEditingCategory(null);
    setCategoryInputName('');

    if (oldName !== updatedCategory.name) {
      onCategoryRenamed(oldName, updatedCategory.name);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === id);
    if (!categoryToDelete) {
      toast.error('Category not found for deletion.');
      return;
    }

    if (!canDeleteCategory(categoryToDelete.name, customerCounts)) return;

    await onDeleteCategory(id);
    onCategorySuccessfullyDeleted(categoryToDelete.name);
  };

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
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryInputName('');
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
                const canDelete = customerCount === 0;

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
                        disabled={!canDelete}
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
