'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryManager from './CategoryManager';
import type { Category, Contact } from '../types';

interface CategoryManagementTabProps {
  categories: Category[];
  customers: Contact[];
  handleCategoriesUpdateAction: (updatedCategories: Category[]) => void;
  handleCategorySuccessfullyDeletedAction: (
    deletedCategoryName: string,
  ) => Promise<void>;
  handleCategoryRenamedAction: (
    oldName: string,
    newName: string,
  ) => Promise<void>;
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  customers,
  handleCategoriesUpdateAction,
  handleCategorySuccessfullyDeletedAction,
  handleCategoryRenamedAction,
}) => {
  const customerCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    customers.forEach((customer) => {
      const categoryName = customer.category || null;
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });
    return counts;
  }, [customers]);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-foreground">Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryManager
          onCategoriesUpdate={handleCategoriesUpdateAction}
          initialCategories={categories}
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
