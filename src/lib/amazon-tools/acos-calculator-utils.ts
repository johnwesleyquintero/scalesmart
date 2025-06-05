import { Currency } from '@/components/amazon-seller-tools/CurrencySelector';

/**
 * Safely parses a string to a number. Returns undefined if parsing fails or input is null/undefined.
 * @param value - The string value to parse.
 * @returns The parsed number or undefined.
 */
const parseNumber = (value: string | undefined | null): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

/**
 * Calculates local advertising metrics such as CTR, CPC, and Sales Per Click Percentage.
 * @param adSpend - Total advertising spend.
 * @param sales - Total sales generated.
 * @param selectedCurrency - The selected currency for display.
 * @param impressions - Optional total ad impressions (as a string, will be parsed).
 * @param clicks - Optional total ad clicks (as a string, will be parsed).
 * @returns An object containing calculated metrics and the currency symbol.
 */
export const calculateLocalMetrics = (
  adSpend: number,
  sales: number,
  selectedCurrency: Currency,
  impressions?: string,
  clicks?: string,
) => {
  let ctr: number | undefined;
  let cpc: number | undefined;
  let salesPerClickPercentage: number | undefined; // Renamed for clarity

  const impressionsNum = parseNumber(impressions);
  const clicksNum = parseNumber(clicks);

  // Ensure impressionsNum and clicksNum are valid numbers before calculation
  if (
    impressionsNum !== undefined &&
    clicksNum !== undefined &&
    impressionsNum > 0
  ) {
    ctr = (clicksNum / impressionsNum) * 100;
    cpc = adSpend / clicksNum;
    salesPerClickPercentage = (sales / clicksNum) * 100;
  }

  const currencySymbol = selectedCurrency?.symbol || '$';

  return {
    ctr,
    cpc,
    salesPerClickPercentage,
    currencySymbol,
  };
};

/**
 * Calculates ACOS (Advertising Cost of Sales) and ROAS (Return on Ad Spend).
 * Handles cases where sales or ad spend are zero to prevent division by zero errors.
 * @param adSpend - Total advertising spend.
 * @param sales - Total sales generated.
 * @returns An object containing calculated ACOS and ROAS.
 */
export const calculateAcosRoas = (adSpend: number, sales: number) => {
  let acos: number | undefined;
  let roas: number | undefined;

  if (sales === 0) {
    // If sales are zero, ACOS is infinite (or undefined), ROAS is 0 (no return)
    acos = Infinity;
    roas = 0;
  } else {
    acos = (adSpend / sales) * 100;
    roas = adSpend === 0 ? (sales > 0 ? Infinity : 0) : sales / adSpend; // Handle adSpend === 0 for ROAS
  }

  return { acos, roas };
};
