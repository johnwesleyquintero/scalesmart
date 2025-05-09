'use client';

import { CampaignData } from '@/components/amazon-seller-tools/acos-calculator';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedValue?: string | number;
}

export const campaignHeaders = {
  required: ['campaign', 'adSpend', 'sales'],
  optional: ['impressions', 'clicks'],
};

export function validateCampaignName(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  let sanitizedValue = '';

  if (typeof value !== 'string') {
    errors.push({
      field: 'campaign',
      message: 'Campaign name must be text',
    });
    return { isValid: false, errors };
  }

  sanitizedValue = value.trim();

  if (!sanitizedValue) {
    errors.push({
      field: 'campaign',
      message: 'Campaign name is required',
    });
    return { isValid: false, errors };
  }

  if (sanitizedValue.length > 100) {
    sanitizedValue = sanitizedValue.slice(0, 100);
  }

  return {
    isValid: true,
    errors,
    sanitizedValue,
  };
}

export function validateNumericField(
  value: unknown,
  fieldName: string,
  allowZero = true,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Handle null or undefined
  if (value === null || value === undefined) {
    if (fieldName !== 'impressions' && fieldName !== 'clicks') {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
      });
      return { isValid: false, errors };
    }
    return { isValid: true, errors, sanitizedValue: 0 };
  }

  // Convert to string and clean up
  const stringValue = String(value).trim();

  // Handle empty string
  if (!stringValue) {
    if (fieldName !== 'impressions' && fieldName !== 'clicks') {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
      });
      return { isValid: false, errors };
    }
    return { isValid: true, errors, sanitizedValue: 0 };
  }

  // Handle percentage values
  let numericValue: number;
  if (stringValue.endsWith('%')) {
    numericValue = Number(stringValue.slice(0, -1)) / 100;
  } else {
    // Remove currency symbols and commas
    const cleanValue = stringValue.replace(/[$,]/g, '');
    numericValue = Number(cleanValue);
  }

  if (isNaN(numericValue)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid number`,
    });
    return { isValid: false, errors };
  }

  if (numericValue < 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} cannot be negative`,
    });
    return { isValid: false, errors };
  }

  if (!allowZero && numericValue === 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} cannot be zero`,
    });
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors,
    sanitizedValue: numericValue,
  };
}

export function validateCampaignRow(
  row: Record<string, unknown>,
  index: number,
): CampaignData {
  // Validate campaign name
  const campaignResult = validateCampaignName(row.campaign);
  if (!campaignResult.isValid) {
    throw new Error(`Row ${index + 1}: ${campaignResult.errors[0].message}`);
  }

  // Validate numeric fields
  const adSpendResult = validateNumericField(row.adSpend, 'adSpend');
  if (!adSpendResult.isValid) {
    throw new Error(`Row ${index + 1}: ${adSpendResult.errors[0].message}`);
  }

  const salesResult = validateNumericField(row.sales, 'sales');
  if (!salesResult.isValid) {
    throw new Error(`Row ${index + 1}: ${salesResult.errors[0].message}`);
  }

  // Validate optional fields
  const impressionsResult = validateNumericField(
    row.impressions,
    'impressions',
  );
  const clicksResult = validateNumericField(row.clicks, 'clicks');

  // Construct the campaign data object
  return {
    campaign: campaignResult.sanitizedValue as string,
    adSpend: adSpendResult.sanitizedValue as number,
    sales: salesResult.sanitizedValue as number,
    impressions: impressionsResult.isValid
      ? (impressionsResult.sanitizedValue as number)
      : undefined,
    clicks: clicksResult.isValid
      ? (clicksResult.sanitizedValue as number)
      : undefined,
  };
}
