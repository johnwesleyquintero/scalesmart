export const exportFormats = ['CSV', 'Excel', 'PDF', 'JSON'] as const;

export type ExportFormat = (typeof exportFormats)[number];

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a duration string (e.g., "2 hours", "30 min") into minutes.
 * Handles variations in units and case insensitivity.
 * @param durationString - The duration string to parse.
 * @returns The duration in minutes, or 0 if parsing fails or input is invalid.
 */
export const parseDuration = (
  durationString: string | null | undefined,
): number => {
  if (!durationString) return 0;
  const parts = durationString.trim().toLowerCase().split(' ');
  let totalMinutes = 0;
  // Map of unit aliases to their value in minutes
  const minutesPerUnit: Record<string, number> = {
    minute: 1,
    minutes: 1,
    min: 1,
    mins: 1,
    hour: 60,
    hours: 60,
    hr: 60,
    hrs: 60,
    day: 1440,
    days: 1440,
  };

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    // Ensure value is a number and there is a unit part
    if (isNaN(value) || !parts[i + 1]) continue;

    // Clean the unit part, removing punctuation like commas/dots
    const unit = parts[i + 1].replace(/[^a-z]/g, '');

    // Find the unit key that matches the parsed unit
    const unitKey = Object.keys(minutesPerUnit).find((key) => key === unit);

    if (unitKey) {
      totalMinutes += value * minutesPerUnit[unitKey];
    }
  }
  return totalMinutes;
};
