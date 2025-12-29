import { PromptData } from './types';
import {
  CUSTOM_CATEGORY_VALUE,
  REQUIRED_CATEGORY_MESSAGE,
  REQUIRED_REQUEST_MESSAGE,
  REQUIRED_CUSTOM_CATEGORY_MESSAGE,
} from './constants';

/**
 * Validates the prompt data form.
 * @param data The prompt data to validate.
 * @returns An object containing validation errors, if any.
 */
export function validatePromptData(
  data: PromptData,
): Partial<Record<keyof PromptData, string>> {
  const errors: Partial<Record<keyof PromptData, string>> = {};
  const { category, customCategory, request } = data;

  if (!category) {
    errors.category = REQUIRED_CATEGORY_MESSAGE;
  }
  if (!request.trim()) {
    errors.request = REQUIRED_REQUEST_MESSAGE;
  }
  if (category === CUSTOM_CATEGORY_VALUE && !customCategory?.trim()) {
    errors.customCategory = REQUIRED_CUSTOM_CATEGORY_MESSAGE;
  }
  return errors;
}
