'use client';

/**
 * @file CustomerForm.tsx
 * @description This component provides a reusable form for adding or editing customer details.
 * It includes fields for name, email, phone, company, notes, and category, with validation
 * using `react-hook-form` and `zod`.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import type { Contact, Category } from '../types'; // Import Category
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components

/**
 * Props for the CustomerForm component.
 */
interface CustomerFormProps {
  initialData?: Omit<Contact, 'id'> | null; // Initial data to pre-fill the form (for editing).
  onSubmitSuccessAction: (data: Omit<Contact, 'id'>) => void; // Callback on successful form submission.
  onCancel?: () => void; // Optional callback for form cancellation (e.g., in edit mode).
  isEditing: boolean; // Flag to indicate if the form is in editing mode.
  categories: Category[]; // List of available categories for the dropdown.
}

/**
 * Zod schema for validating customer form inputs.
 * Defines validation rules for each field.
 */
const customerSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')), // Allow empty string for optional email.
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
      message: 'Please enter a valid phone number.',
    })
    .optional()
    .or(z.literal('')), // Allow empty string for optional phone.
  company: z.string().optional().nullable(), // Company can be optional and null.
  notes: z.string().optional().nullable(), // Notes can be optional and null.
  category: z.string().optional().nullable(), // Category can be optional and null.
});

/**
 * Type definition for the form values, inferred from the Zod schema.
 */
type CustomerFormValues = z.infer<typeof customerSchema>;

/**
 * Default values for the customer form, used for resetting or initial state.
 */
const defaultFormData: CustomerFormValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
  category: '', // Default to empty string for no category.
};

/**
 * CustomerForm component.
 * A controlled form for adding or updating customer information.
 */
export function CustomerForm({
  initialData,
  onSubmitSuccessAction,
  onCancel,
  isEditing,
  categories,
}: CustomerFormProps) {
  // Initialize react-hook-form with Zod resolver and default values.
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultFormData,
    mode: 'onChange', // Validate on change for immediate feedback.
  });

  /**
   * Effect to populate the form when `initialData` changes (e.g., when editing a customer).
   * Resets to default form data if `initialData` is null.
   */
  useEffect(() => {
    if (initialData) {
      // Set form values based on initialData. Use empty string for optional fields that are null/undefined.
      setValue('name', initialData.name);
      setValue('email', initialData.email || '');
      setValue('phone', initialData.phone || '');
      setValue('company', initialData.company || '');
      setValue('notes', initialData.notes || '');
      setValue('category', initialData.category || '');
    } else {
      reset(defaultFormData); // Reset form to default if no initial data.
    }
  }, [initialData, setValue, reset]); // Dependencies for useEffect.

  /**
   * Handles the form submission.
   * Transforms form data to match `Contact` type and calls the `onSubmitSuccessAction`.
   */
  const onSubmit = (data: CustomerFormValues) => {
    onSubmitSuccessAction({
      name: data.name,
      email: data.email ?? '', // Coalesce null/undefined to empty string.
      phone: data.phone ?? '', // Coalesce null/undefined to empty string.
      company: data.company || '', // Coalesce null/undefined to empty string.
      notes: data.notes || '', // Coalesce null/undefined to empty string.
      category: data.category || '', // Coalesce null/undefined to empty string.
    });
    // Reset form only if not in editing mode (i.e., adding a new customer).
    if (!isEditing) {
      reset(defaultFormData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="John Doe"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name?.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500 mt-1">
              {errors.email?.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="(XXX) XXX+XXXX"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-red-500 mt-1">
            {errors.phone?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="company">Company (optional)</Label>
        <Input
          id="company"
          {...register('company')}
          placeholder="Company"
          aria-invalid={!!errors.company}
          aria-describedby={errors.company ? 'company-error' : undefined}
        />
        {errors.company && (
          <p id="company-error" className="text-sm text-red-500 mt-1">
            {errors.company?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="category">Category (optional)</Label>
        <Select
          onValueChange={(
            value: string, // Explicitly type 'value' as string
          ) => setValue('category', value === '__no_category__' ? '' : value)}
          value={initialData?.category || '__no_category__'} // Map empty string to special value for display
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__no_category__" label="No Category">
              No Category
            </SelectItem>
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.name}
                label={category.name}
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
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
