import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class names into a single string, handling Tailwind CSS conflicts.
 * Uses `clsx` for conditional class joining and `tailwind-merge` for resolving conflicting Tailwind classes.
 * @param inputs - An array of class values (strings, arrays, objects, or falsy values).
 * @returns A single string containing the merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-friendly slug from a given string.
 * Converts the string to lowercase, replaces spaces with hyphens,
 * removes non-alphanumeric characters (except hyphens), and trims leading/trailing hyphens.
 * @param title - The input string to generate a slug from.
 * @returns The generated slug string.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
