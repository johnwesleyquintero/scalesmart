import { monetaryValueSchema } from '@/lib/input-validation';
import { logger } from '@/lib/logger';
import { FbaCalculationInput, FbaCalculationResult } from '@/components/amazon-seller-tools/fba-calculator';

export const calculateRoi = (profit: number, cost: number): number => {
  if (cost === 0) {
    if (profit === 0) return 0;
    return profit > 0 ? Infinity : -Infinity;
  }
  return (profit / cost) * 100;
};

export const calculateMargin = (profit: number, price: number): number => {
  if (price === 0) {
    if (profit === 0) return 0;
    return profit > 0 ? Infinity : -Infinity;
  }
  return (profit / price) * 100;
};

export const calculateFbaMetrics = async (
  input: FbaCalculationInput,
): Promise<Pick<FbaCalculationResult, 'profit' | 'roi' | 'margin'>> => {
  try {
    const validatedCost = monetaryValueSchema.parse(input.cost);
    const validatedPrice = monetaryValueSchema.parse(input.price);
    const validatedFees = monetaryValueSchema.parse(input.fees);

    const profit = validatedPrice - validatedCost - validatedFees;
    const roi = calculateRoi(profit, validatedCost);
    const margin = calculateMargin(profit, validatedPrice);

    return { profit, roi, margin };
  } catch (error) {
    // Log the error with detailed information
    logger.error('Failed to calculate FBA metrics', {
      component: 'FbaCalculator',
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    // Rethrow with more descriptive message
    throw new Error(
      `Failed to calculate FBA metrics: ${error instanceof Error ? error.message : 'Invalid input values'}`,
    );
  }
};
