'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from './CustomerForm';
import type { Contact, Category } from '../types';

interface AddCustomerTabProps {
  categories: Category[];
  handleSaveCustomerAction: (
    formData: Omit<Contact, 'id'>,
    editingCustomer: Contact | null,
  ) => Promise<void>;
}

export const AddCustomerTab: React.FC<AddCustomerTabProps> = ({
  categories,
  handleSaveCustomerAction,
}) => {
  const handleSave = async (formData: Omit<Contact, 'id'>) => {
    await handleSaveCustomerAction(formData, null); // Always adding a new customer
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
