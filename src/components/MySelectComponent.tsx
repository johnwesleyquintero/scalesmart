// src/components/MySelectComponent.tsx
import React from 'react';
import * as Select from '@radix-ui/react-select';
import { logger } from '../lib/logger'; // Assuming a centralized logger utility

// Define a more robust type for Select items
interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean; // Add disabled prop for better control
}

interface MySelectProps {
  options: SelectOption[]; // Renamed 'items' to 'options' for clarity
  defaultValue?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void; // Add callback for value changes
}

/**
 * MySelectComponent: A reusable Select component with enhanced error handling and logging.
 *
 * This component ensures that all Select.Item elements have a valid, non-empty value.
 * It logs warnings for invalid data and provides clear feedback for debugging.
 */
export function MySelectComponent({
  options,
  defaultValue,
  placeholder,
  onValueChange,
}: MySelectProps) {
  // Filter out invalid options and log warnings for debugging
  const validOptions = options.filter((option) => {
    if (!option.value || option.value.trim() === '') {
      logger.warn(
        `Invalid SelectOption: An option with label "${option.label}" has an empty or missing value. This item will be skipped.`,
      );
      // In a real application, you might throw an error or provide a fallback value
      return false; // Exclude invalid options from rendering
    }
    return true;
  });

  // Log if no valid options are available, which might indicate a data fetching issue
  if (validOptions.length === 0 && options.length > 0) {
    logger.info(
      'MySelectComponent received options, but none were valid after filtering. Check data source.',
    );
  }

  return (
    <Select.Root defaultValue={defaultValue} onValueChange={onValueChange}>
      <Select.Trigger aria-label="Select an option">
        {' '}
        {/* Add aria-label for accessibility and clarity */}
        <Select.Value placeholder={placeholder || 'Select an option...'} />{' '}
        {/* Provide a default placeholder */}
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={5}>
          {' '}
          {/* Use popper position for better overlay management */}
          <Select.Viewport>
            {validOptions.length > 0 ? (
              validOptions.map((option, index) => (
                // Ensure value is always valid here due to filtering
                <Select.Item
                  key={option.value || `select-item-${index}`}
                  value={option.value}
                  disabled={option.disabled}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {/* Add a checkmark or icon for selected item for better UX */}
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              ))
            ) : (
              // Provide a fallback message if no valid options are present
              <Select.Item value="no-options" disabled>
                <Select.ItemText>No options available</Select.ItemText>
              </Select.Item>
            )}
          </Select.Viewport>
          <Select.ScrollDownButton /> {/* Add scroll buttons for long lists */}
          <Select.ScrollUpButton />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
