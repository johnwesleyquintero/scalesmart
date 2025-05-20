'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react'; // useState and toast were unused
import type { Customer, Category } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface CustomerFormProps {
  initialData?: (Omit<Customer, 'id'> & { category?: string | null }) | null;
  onSubmitSuccessAction: (data: Omit<Customer, 'id'>) => void;
  onCancel?: () => void;
  isEditing: boolean;
  categories: Category[]; // Receive categories as a prop
}

const customerSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
      message: 'Please enter a valid phone number.',
    })
    .optional()
    .or(z.literal('')),
  notes: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const defaultFormData: CustomerFormValues = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  category: 'null', // Use 'null' string to represent "None" to match SelectItem value
};

export function CustomerForm({
  initialData,
  onSubmitSuccessAction,
  onCancel,
  isEditing,
  categories, // Destructure categories from props
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch, // Import watch
    formState: { errors },
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultFormData,
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('email', initialData.email || '');
      setValue('phone', initialData.phone || '');
      setValue('notes', initialData.notes || '');
      setValue('category', initialData.category || 'null'); // Set to 'null' string if category is null/undefined
    } else {
      // Reset to default values, including category: 'null'
      reset(defaultFormData);
    }
  }, [initialData, setValue, reset]);

  const handleCategoryChange = (value: string) => {
    setValue('category', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = (data: CustomerFormValues) => {
    // Convert empty string category to null
    const category = data.category === 'null' ? null : data.category;
    onSubmitSuccessAction({
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      notes: data.notes || '',
      category: category ?? null,
    });
    if (!isEditing) {
      reset(defaultFormData); // Reset form to defaults after adding
    }
  };

  const currentCategoryValue = watch('category');
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
        <Label htmlFor="category">Category</Label>
        <Select
          // currentCategoryValue is typed as string | null | undefined from Zod.
          // Select's value prop expects string | undefined.
          value={
            currentCategoryValue === null ? undefined : currentCategoryValue
          }
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* You can add error display for category if validation is needed in the future */}
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
