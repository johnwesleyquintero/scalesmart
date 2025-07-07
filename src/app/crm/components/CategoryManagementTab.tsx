'use client';

/**
 * @file CategoryManagementTab.tsx
 * @description This component provides the UI for managing customer categories.
 * It displays a list of categories and allows for their creation, renaming, and deletion.
 * It also shows the count of customers associated with each category.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryManager from './CategoryManager';
import type { Category, Contact } from '../types';

/**
 * Props for the CategoryManagementTab component.
 */
interface CategoryManagementTabProps {
  categories: Category[]; // List of all available categories.
  customers: Contact[]; // List of all customers, used to calculate category counts.
  // Handlers for category actions, now passed down to CategoryManager
  handleAddCategoryAction: (name: string) => Promise<Category | string | void>;
  handleUpdateCategoryAction: (category: Category) => Promise<void>;
  handleDeleteCategoryAction: (id: string) => Promise<void>;
  handleCategorySuccessfullyDeletedAction: (
    deletedCategoryName: string,
  ) => Promise<void>; // Callback when a category is successfully deleted.
  handleCategoryRenamedAction: (
    oldName: string,
    newName: string,
  ) => Promise<void>; // Callback when a category is renamed.
}

/**
 * CategoryManagementTab component.
 * Manages the display and interaction for customer categories.
 */
export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  customers,
  handleAddCategoryAction, // Destructure new props
  handleUpdateCategoryAction,
  handleDeleteCategoryAction,
  handleCategorySuccessfullyDeletedAction,
  handleCategoryRenamedAction,
}) => {
  /**
   * Memoized calculation of customer counts per category.
   * This prevents recalculation on every render unless the `customers` array changes.
   * The key for the map is the category name (string) or `null` for uncategorized customers.
   */
  const customerCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    customers.forEach((customer) => {
      // Use customer.category as the key, or null if no category is assigned.
      const categoryName = customer.category || null;
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });
    return counts;
  }, [customers]); // Recalculate only when `customers` array changes.

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-foreground">Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {/* CategoryManager component handles the core logic for category operations */}
        <CategoryManager
          categories={categories} // Pass categories prop
          onAddCategory={handleAddCategoryAction} // Pass add handler
          onUpdateCategory={handleUpdateCategoryAction} // Pass update handler
          onDeleteCategory={handleDeleteCategoryAction} // Pass delete handler
          onCategorySuccessfullyDeleted={
            handleCategorySuccessfullyDeletedAction
          }
          onCategoryRenamed={handleCategoryRenamedAction}
          customerCounts={customerCounts}
        />
      </CardContent>
    </Card>
  );
};
