'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryManager from './CategoryManager';
import type { Category, Customer } from '../types';

interface CategoryManagementTabProps {
  categories: Category[];
  customers: Customer[];
  handleCategoriesUpdate: (updatedCategories: Category[]) => void;
  handleCategorySuccessfullyDeleted: (
    deletedCategoryName: string,
  ) => Promise<void>;
  handleCategoryRenamed: (oldName: string, newName: string) => Promise<void>;
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  customers,
  handleCategoriesUpdate,
  handleCategorySuccessfullyDeleted,
  handleCategoryRenamed,
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
        <CardTitle>Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryManager
          onCategoriesUpdate={handleCategoriesUpdate}
          initialCategories={categories}
          onCategorySuccessfullyDeleted={handleCategorySuccessfullyDeleted}
          onCategoryRenamed={handleCategoryRenamed}
          customerCounts={customerCounts}
        />
      </CardContent>
    </Card>
  );
};
