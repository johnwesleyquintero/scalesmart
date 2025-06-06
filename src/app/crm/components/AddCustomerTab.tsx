'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from './CustomerForm';
import type { Contact, Customer, Category } from '../types';

interface AddCustomerTabProps {
  categories: Category[];
  handleSaveCustomer: (
    formData: Omit<Contact, 'id'>,
    editingCustomer: Customer | null,
  ) => Promise<void>;
}

export const AddCustomerTab: React.FC<AddCustomerTabProps> = ({
  categories,
  handleSaveCustomer,
}) => {
  const handleSave = async (formData: Omit<Contact, 'id'>) => {
    await handleSaveCustomer(formData, null); // Always adding a new customer
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Add New Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomerForm
          onSubmitSuccessAction={handleSave}
          isEditing={false}
          categories={categories}
        />
      </CardContent>
    </Card>
  );
};
