// src/components/MySelectComponent.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Import useState, useEffect, and useMemo
import * as Select from '@radix-ui/react-select';
import { logger } from '../lib/logger'; // Assuming a centralized logger utility

// Define a more robust type for Select items
interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean; // Add disabled prop for better control
}

// Use conditional types for MySelectProps based on isMulti
interface MySelectProps<T extends boolean = false> {
  options: SelectOption[]; // Renamed 'items' to 'options' for clarity
  placeholder?: string;
  isMulti?: T;
  defaultValue?: T extends true ? string[] | undefined : string | undefined;
  onValueChange?: T extends true
    ? (value: string[]) => void
    : (value: string) => void;
}

/**
 * MySelectComponent: A reusable Select component with enhanced error handling and logging.
 *
 * This component ensures that all Select.Item elements have a valid, non-empty value.
 * It logs warnings for invalid data and provides clear feedback for debugging.
 * Supports both single and multi-select modes.
 */
export function MySelectComponent<T extends boolean = false>({
  // Add type parameter to function component
  options,
  defaultValue,
  placeholder,
  onValueChange,
  isMulti,
}: MySelectProps<T>) {
  // Use the type parameter in props
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

  // Manage selected value(s) internally
  const [selectedValue, setSelectedValue] = useState<
    string | string[] | undefined
  >(() => {
    if (isMulti) {
      return defaultValue as string[] | undefined;
    } else {
      return defaultValue as string | undefined;
    }
  });

  // Synchronize internal state with defaultValue prop
  useEffect(() => {
    const valueToSet = isMulti
      ? (defaultValue as string[] | undefined)
      : (defaultValue as string | undefined);

    setSelectedValue(valueToSet);
  }, [defaultValue, isMulti]);

  /**
   * Handles the value change event from the Radix UI Select component.
   * This function manages both single and multi-select logic and
   * calls the appropriate onValueChange callback based on the `isMulti` prop.
   * Explicit type casting is used here to help TypeScript correctly infer
   * the type of the `onValueChange` callback within the conditional logic,
   * addressing potential type inference issues that can hinder debugging.
   * @param value The new value(s) from the select component. Note: Radix UI's
   *              onValueChange for the Root component always provides a single
   *              string value, even in multi-select scenarios. The multi-select
   *              logic is handled internally by managing the `selectedValue` state.
   */
  const handleValueChange = (value: string) => {
    if (isMulti) {
      // Handle multi-select logic: Add or remove the selected value from the array
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      setSelectedValue(newValues);

      // Explicitly cast onValueChange for multi-select to ensure correct type
      // This helps TypeScript understand that when isMulti is true, onValueChange
      // expects a string array, resolving potential type errors and improving
      // debugging clarity by making the expected type explicit.
      (onValueChange as ((value: string[]) => void) | undefined)?.(newValues);
    } else {
      // Handle single-select logic: Set the selected value directly
      setSelectedValue(value);

      // Explicitly cast onValueChange for single-select to ensure correct type
      // Similar to the multi-select case, this clarifies the expected type
      // (a single string) for TypeScript when isMulti is false, aiding in
      // type checking and debugging.
      (onValueChange as ((value: string) => void) | undefined)?.(value);
    }
  };

  // Determine the value to display in the trigger
  const displayValue = useMemo(() => {
    if (isMulti && Array.isArray(selectedValue)) {
      const selectedLabels = selectedValue
        .map((value) => {
          const option = validOptions.find((opt) => opt.value === value);
          return option ? option.label : value; // Use label if found, otherwise use value
        })
        .filter((label) => label); // Filter out any undefined or empty labels

      return selectedLabels.join(', '); // Join selected labels for display
    }
    // For single select or if selectedValue is not an array
    const selectedOption = validOptions.find(
      (opt) => opt.value === selectedValue,
    );
    return selectedOption ? selectedOption.label : selectedValue; // Display label or value
  }, [selectedValue, isMulti, validOptions]);

  return (
    <Select.Root
      onValueChange={handleValueChange}
      // Radix UI Select does not have a direct multi-select prop on the Root.
      // Multi-select behavior is typically managed by handling the onValueChange
      // and rendering selected items differently.
    >
      <Select.Trigger aria-label="Select an option">
        {' '}
        {/* Add aria-label for accessibility and clarity */}
        <Select.Value placeholder={placeholder || 'Select an option...'}>
          {displayValue || placeholder || 'Select an option...'}{' '}
          {/* Display selected value(s) */}
        </Select.Value>{' '}
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
                  {isMulti &&
                    Array.isArray(selectedValue) &&
                    selectedValue.includes(option.value) && (
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    )}
                  {!isMulti && selectedValue === option.value && (
                    <Select.ItemIndicator>✓</Select.ItemIndicator>
                  )}
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
