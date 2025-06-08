'use client';

import React from 'react';
import Modal from '@/components/Modal';
import { CustomerForm } from './CustomerForm';
import type { Contact, Category } from '../types';

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Contact | null;
  handleSaveCustomerAndClearEdit: (
    formData: Omit<Contact, 'id'>,
    customerToEdit: Contact | null,
  ) => Promise<void>;
  categories: Category[];
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  isOpen,
  onClose,
  editingCustomer,
  handleSaveCustomerAndClearEdit,
  categories,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCustomer ? 'Edit Customer' : ''}
    >
      {editingCustomer && (
        <CustomerForm
          initialData={editingCustomer}
          onSubmitSuccessAction={(formData) =>
            handleSaveCustomerAndClearEdit(formData, editingCustomer)
          }
          onCancel={onClose}
          isEditing={true}
          categories={categories}
        />
      )}
    </Modal>
  );
};

export default CustomerEditModal;
