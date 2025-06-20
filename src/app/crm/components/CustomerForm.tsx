'use client';
import { TagifyCustomEvent } from '@/types/custom';
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
import { useEffect, useRef, useState } from 'react';
import type { Contact, Category, SalesStage } from '../types'; // Import Category and SalesStage
import { SALES_STAGES } from '../types';
import { useForm } from 'react-hook-form';
import Tagify from '@yaireo/tagify';
import '@yaireo/tagify/dist/tagify.css';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sanitizeHtml } from '@/lib/sanitize'; // Import sanitizeHtml

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
    .or(z.literal(''))
    .transform((e) => (e === '' ? undefined : e)), // Allow empty string for optional email.
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
      message: 'Please enter a valid phone number.',
    })
    .optional()
    .or(z.literal(''))
    .transform((p) => (p === '' ? undefined : p)), // Allow empty string for optional phone.
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  salesStage: z.enum(SALES_STAGES).optional().nullable(),
  tags: z.string().array().optional(),
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
  salesStage: 'Lead', // Default to 'Lead' for sales stage.
  tags: [],
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
    watch, // Add watch to get current form values
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultFormData,
    mode: 'onChange', // Validate on change for immediate feedback.
  });

  // Watch for changes in category and salesStage to control Select components
  const watchedCategory = watch('category');
  const watchedSalesStage = watch('salesStage');

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
      // Ensure category is set to an empty string if null/undefined for the Select component
      setValue('category', initialData.category || '');
      // Ensure salesStage is set to null if null/undefined for the Select component
      setValue('salesStage', initialData.salesStage || null);
      setValue('tags', initialData.tags || []);
    } else {
      reset(defaultFormData); // Reset form to default if no initial data.
    }
  }, [initialData, setValue, reset]); // Dependencies for useEffect.

  /**
   * Handles the form submission.
   * Transforms form data to match `Contact` type and calls the `onSubmitSuccessAction`.
   */
  const onSubmit = (data: CustomerFormValues) => {
    // Sanitize potentially unsafe fields before submitting
    const sanitizedData = {
      name: sanitizeHtml(data.name),
      email: data.email ?? '', // Email format is validated by Zod, no HTML expected
      phone: data.phone ?? '', // Phone format is validated by Zod, no HTML expected
      company: data.company ? sanitizeHtml(data.company) : '',
      notes: data.notes ? sanitizeHtml(data.notes) : '',
      salesStage: data.salesStage || null,
      category: data.category || '',
      tags: data.tags || [], // Tags are typically simple strings, sanitization might be overkill but can be added if needed
    };

    onSubmitSuccessAction(sanitizedData);
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
          onValueChange={(value: string) =>
            setValue('category', value === '__no_category__' ? '' : value, {
              shouldValidate: true,
            })
          }
          value={watchedCategory || '__no_category__'} // Use watched value
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
        <Label htmlFor="salesStage">Sales Stage</Label>
        <Select
          onValueChange={(value: string) =>
            setValue(
              'salesStage',
              value === '__no_sales_stage__' ? null : (value as SalesStage),
              { shouldValidate: true },
            )
          }
          value={watchedSalesStage || '__no_sales_stage__'} // Use watched value
        >
          <SelectTrigger id="salesStage">
            <SelectValue placeholder="Select sales stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__no_sales_stage__" label="No Sales Stage">
              No Sales Stage
            </SelectItem>
            {SALES_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage} label={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="tags">Tags (optional)</Label>
        <TagsInput
          key={watch('tags')?.join(', ')}
          initialTags={watch('tags') || []}
          onChange={(tags: string[]) => {
            setValue('tags', tags);
          }}
        />
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

interface TagsInputProps {
  initialTags: string[];
  onChange: (tags: string[]) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({ initialTags, onChange }) => {
  const [tags, setTags] = useState<string[]>([]);
  const tagifyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tagifyRef.current) return;

    const tagify = new Tagify(tagifyRef.current, {
      whitelist: [], // You can add a whitelist of tags here
      dropdown: {
        maxItems: 20,
        classname: 'tags-look',
        enabled: 0,
        closeOnSelect: false,
      },
    });

    tagifyRef.current.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const newTags = target.value.split(',').map((tag: string) => tag.trim());
      setTags(newTags);
      onChange(newTags);
    });

    return () => {
      tagify.destroy();
    };
  }, [onChange]);

  return (
    <input
      ref={tagifyRef}
      defaultValue={initialTags.join(',')}
      name="tags"
      placeholder="Enter tags"
      aria-labelledby="tags" // Added aria-labelledby to link to the label
    />
  );
};
