import { toast } from '@/app/hooks/use-toast.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  validateFbaForm,
  type FbaFormData,
} from '@/lib/amazon-tools/fba-form-schema';
import React, { useEffect } from 'react'; // Import useEffect
import type { FbaCalculationInput } from './fba-calculator';

interface ManualFbaFormProps {
  initialValues: FbaCalculationInput;
  onSubmit: (values: FbaCalculationInput) => void;
  onReset: () => void;
}

export default function ManualFbaForm({
  initialValues,
  onSubmit,
  onReset,
}: Readonly<ManualFbaFormProps>) {
  const [values, setValues] =
    React.useState<FbaCalculationInput>(initialValues);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Effect to synchronize internal state with initialValues prop
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]); // Re-run when initialValues changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev: FbaCalculationInput) => {
      // Store as string for numeric inputs, validation will handle conversion
      // This allows invalid numeric input (e.g., "abc") to remain in the field
      // until validation, providing better user feedback.
      const newValues = {
        ...prev,
        [name]: value,
      };
      return newValues;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert numeric values from string to number for validation
      const formDataForValidation: FbaFormData = {
        ...values,
        cost: Number(values.cost),
        price: Number(values.price),
        fees: Number(values.fees),
      };

      const validationErrors = validateFbaForm(formDataForValidation);

      if (validationErrors.length > 0) {
        console.warn('FBA form validation failed', {
          component: 'ManualFbaForm',
          errors: validationErrors,
          formData: values,
        });

        toast({
          title: 'Validation Error',
          description: validationErrors[0].message,
          variant: 'destructive', // Add variant
        });
        return;
      }

      console.info('FBA form submitted successfully', {
        component: 'ManualFbaForm',
        formData: values,
      });

      // Ensure numbers are passed to onSubmit
      onSubmit(formDataForValidation);
    } catch (error) {
      console.error((error as Error).message, {
        component: 'ManualFbaForm',
        error: error instanceof Error ? error.message : 'Unknown error',
        formData: values,
      });

      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive', // Add variant
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
