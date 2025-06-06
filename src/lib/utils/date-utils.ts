import { format } from 'date-fns';

const INVALID_DATE_STRING = 'Invalid Date';

/**
 * @brief Formats a given timestamp or Date object into a human-readable date string.
 * @param dateInput The date to format, can be a Date object or a number (timestamp).
 * @param formatStr The format string (e.g., 'PPP', 'MM/dd/yyyy'). Defaults to 'PPP'.
 * @returns {string} The formatted date string, or 'Invalid Date' if the input is invalid.
 */
export const formatDate = (
  dateInput: Date | number | undefined,
  formatStr: string = 'PPP',
): string => {
  if (!dateInput) {
    return 'No date';
  }
  try {
    const date = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return INVALID_DATE_STRING;
    }
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return INVALID_DATE_STRING;
  }
};

/**
 * @brief Formats a given timestamp or Date object into a human-readable date and time string.
 * @param dateInput The date to format, can be a Date object or a number (timestamp).
 * @param formatStr The format string (e.g., 'PPP p', 'MM/dd/yyyy HH:mm'). Defaults to 'PPP p'.
 * @returns {string} The formatted date and time string, or 'Invalid Date' if the input is invalid.
 */
export const formatDateTime = (
  dateInput: Date | number | undefined,
  formatStr: string = 'PPP p',
): string => {
  if (!dateInput) {
    return 'No date/time';
  }
  try {
    const date = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return INVALID_DATE_STRING;
    }
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return INVALID_DATE_STRING;
  }
};
