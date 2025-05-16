'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Customer } from '../types';

interface CustomerFormProps {
  initialData?: Omit<Customer, 'id'> | null;
  onSubmitSuccess: (data: Omit<Customer, 'id'>) => void;
  onCancel?: () => void;
  isEditing: boolean;
}

const defaultFormData: Omit<Customer, 'id'> = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  category: '',
};

export function CustomerForm({
  initialData,
  onSubmitSuccess,
  onCancel,
  isEditing,
}: CustomerFormProps) {
  const [formData, setFormData] =
    useState<Omit<Customer, 'id'>>(defaultFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof Omit<Customer, 'id'>, string>>
  >({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultFormData);
    }
    setErrors({}); // Clear errors when initialData changes (e.g., switching from edit to add)
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for the field being edited
    if (errors[name as keyof Omit<Customer, 'id'>]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<Customer, 'id'>, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/; // Basic US phone number format

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone =
        'Please enter a valid phone number in the format XXX-XXX-XXXX.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmitSuccess(formData);
      if (!isEditing) {
        setFormData(defaultFormData); // Reset form after successful add
      }
      // For editing, parent will change initialData which triggers useEffect to reset/repopulate
    } else {
      toast.error('Please correct the errors in the form.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500 mt-1">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="XXX-XXX-XXXX"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-red-500 mt-1">
            {errors.phone}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          placeholder="e.g., Lead, VIP, Past Client"
        />
        {/* You can add error display for category if validation is needed in the future */}
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Customer preferences, special requirements, etc."
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        {isEditing && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="mr-2"
          >
            Cancel
          </Button>
        )}
        <Button type="submit">
          {isEditing ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}
