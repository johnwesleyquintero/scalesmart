import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  validateFbaForm,
  type FbaFormData,
} from '@/lib/amazon-tools/fba-form-schema';
import { logger } from '@/lib/logger';
import { AlertCircle } from 'lucide-react';
import React from 'react';
import type { FbaCalculationInput } from './fba-calculator';

interface ManualFbaFormProps {
  initialValues: FbaCalculationInput;
  onSubmit: (values: FbaCalculationInput, errors?: ValidationError[]) => void;
  onReset: () => void;
}

import { ValidationError } from '@/lib/amazon-tools/fba-form-schema';

export default function ManualFbaForm({
  initialValues,
  onSubmit,
  onReset,
}: Readonly<ManualFbaFormProps>) {
  const { toast } = useToast();
  const [values, setValues] =
    React.useState<FbaCalculationInput>(initialValues);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev: FbaCalculationInput) => {
      const newValues = {
        ...prev,
        [name]:
          name === 'product' ? value : isNaN(Number(value)) ? 0 : Number(value),
      };
      return newValues;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]); // Clear previous errors

    try {
      // Validate form data using Zod schema
      const newErrors = validateFbaForm({
        product: values.product.trim(),
        cost: values.cost,
        price: values.price,
        fees: values.fees,
      } as FbaFormData);

      if (newErrors.length > 0) {
        // Log validation errors
        logger.warn('FBA form validation failed', {
          component: 'ManualFbaForm',
          errors: newErrors,
          formData: values,
        });

        // Set errors state to display inline validation messages
        setErrors(newErrors);
        toast({
          title: 'Validation Error',
          description: 'Please correct the errors in the form.',
        });
        return;
      }

      // Log successful submission
      logger.info('FBA form submitted successfully', {
        component: 'ManualFbaForm',
        formData: values,
      });

      onSubmit(values);
    } catch (error) {
      // Log unexpected errors
      logger.error('Unexpected error in FBA form submission', {
        component: 'ManualFbaForm',
        error: error instanceof Error ? error.message : 'Unknown error',
        formData: values,
      });

      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="manual-fba-form"
      aria-label="FBA Calculator Form"
    >
      {errors.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="space-y-1 flex-grow">
            {errors.map((error) => (
              <p
                key={error.field}
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error.message}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="product">Product Name*</Label>
        <Input
          id="product"
          name="product"
          value={values.product}
          onChange={handleChange}
          placeholder="Enter product name"
          required
        />
        {errors.find((e) => e.field === 'product') && (
          <div role="alert" aria-live="polite" className="mt-1">
            <p
              className="text-sm text-destructive"
              data-testid="product-name-error"
            >
              {errors.find((e) => e.field === 'product')?.message}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Product Cost ($)*</Label>
        <Input
          id="cost"
          name="cost"
          type="number"
          value={values.cost}
          onChange={handleChange}
          placeholder="e.g., 10.50"
          min="0"
          step="0.01"
          required
        />
        {errors.find((e) => e.field === 'cost') && (
          <div role="alert" aria-live="polite" className="mt-1">
            <p className="text-sm text-destructive" data-testid="cost-error">
              {errors.find((e) => e.field === 'cost')?.message}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Selling Price ($)*</Label>
        <Input
          id="price"
          name="price"
          type="number"
          value={values.price}
          onChange={handleChange}
          placeholder="e.g., 29.99"
          min="0"
          step="0.01"
          required
        />
        {errors.find((e) => e.field === 'price') && (
          <div role="alert" aria-live="polite" className="mt-1">
            <p className="text-sm text-destructive" data-testid="price-error">
              {errors.find((e) => e.field === 'price')?.message}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fees">Amazon Fees ($)*</Label>
        <Input
          id="fees"
          name="fees"
          type="number"
          value={values.fees}
          onChange={handleChange}
          placeholder="e.g., 5.75"
          min="0"
          step="0.01"
          required
        />
        {errors.find((e) => e.field === 'fees') && (
          <div role="alert" aria-live="polite" className="mt-1">
            <p className="text-sm text-destructive" data-testid="fees-error">
              {errors.find((e) => e.field === 'fees')?.message}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          Calculate
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
