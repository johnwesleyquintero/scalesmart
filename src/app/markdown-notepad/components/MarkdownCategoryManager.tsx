'use client';

import { useState, useEffect } from 'react'; // Removed useMemo
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
import { Category } from '@/types/indexeddb'; // Removed Note import
import { useToast } from '@/hooks/use-toast'; // Re-add useToast

interface MarkdownCategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCategoryRenamed: (oldName: string, newName: string) => Promise<void>;
  getNoteCountsByCategory: () => Promise<Map<string, number>>; // Add the new prop
  noteCounts: Map<string, number>; // Add noteCounts as a prop
}

const MarkdownCategoryManager = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCategoryRenamed,
  getNoteCountsByCategory, // Destructure the new prop
  noteCounts, // Destructure noteCounts
}: MarkdownCategoryManagerProps) => {
  const [categoryInputName, setCategoryInputName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast(); // Re-initialize useToast

  useEffect(() => {
    if (editingCategory) {
      setCategoryInputName(editingCategory.name);
    } else {
      setCategoryInputName('');
    }
  }, [editingCategory]);

  const validateCategoryName = (
    name: string,
    currentCategories: Category[],
    excludeId?: string,
  ) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        title: 'Error',
        description: 'Category name cannot be empty.',
        variant: 'destructive',
      });
      return false;
    }

    if (trimmedName.length > 50) {
      toast({
        title: 'Error',
        description: 'Category name cannot exceed 50 characters.',
        variant: 'destructive',
      });
      return false;
    }

    // Basic check for invalid characters (e.g., for potential file system or URL usage)
    // Allows alphanumeric, spaces, hyphens, and underscores
    const invalidCharRegex = /[^a-zA-Z0-9\s-_]/;
    if (invalidCharRegex.test(trimmedName)) {
      toast({
        title: 'Error',
        description:
          'Category name contains invalid characters. Only alphanumeric, spaces, hyphens, and underscores are allowed.',
        variant: 'destructive',
      });
      return false;
    }

    const isDuplicate = currentCategories.some(
      (cat) =>
        cat.name.toLowerCase() === trimmedName.toLowerCase() &&
        cat.id !== excludeId,
    );
    if (isDuplicate) {
      toast({
        title: 'Error',
        description: 'Category with this name already exists.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const canDeleteCategory = (
    categoryName: string,
    counts: Map<string, number>,
  ) => {
    const count = counts.get(categoryName) || 0;
    if (count > 0) {
      toast({
        title: 'Error',
        description: `Cannot delete category "${categoryName}" because it has ${count} note(s) assigned.`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleAddCategory = async () => {
    const trimmedCategoryName = categoryInputName.trim();
    if (!validateCategoryName(trimmedCategoryName, categories)) return;

    try {
      await onAddCategory(trimmedCategoryName);
      setCategoryInputName('');
    } catch (error: unknown) {
      // Error handled by useMarkdownCategories hook
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryInputName(category.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      toast({
        title: 'Error',
        description: 'No category selected for update.',
        variant: 'destructive',
      });
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

    try {
      await onUpdateCategory(updatedCategory);
      setEditingCategory(null);
      setCategoryInputName('');
      if (oldName !== updatedCategory.name) {
        await onCategoryRenamed(oldName, updatedCategory.name);
      }
    } catch (error: unknown) {
      // Error handled by useMarkdownCategories hook
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === id);
    if (!categoryToDelete) {
      toast({
        title: 'Error',
        description: 'Category not found for deletion.',
        variant: 'destructive',
      });
      return;
    }

    if (!canDeleteCategory(categoryToDelete.name, noteCounts)) return;

    try {
      await onDeleteCategory(id);
    } catch (error: unknown) {
      // Error handled by useMarkdownCategories hook
    }
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
                <TableHead className="text-center">Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const noteCount = noteCounts.get(category.name) || 0;
                const canDelete = noteCount === 0;

                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                        {noteCount}
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
                            ? `Cannot delete: ${noteCount} note(s) assigned.`
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
                    {noteCounts.get('uncategorized') || 0}
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

export default MarkdownCategoryManager;
