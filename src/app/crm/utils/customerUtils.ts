/**
 * @file customerUtils.ts
 * @description This file contains utility functions for managing customer data,
 * including filtering, searching, and exporting to CSV.
 */

import type { Contact } from '../types';
import Papa from 'papaparse';
import fuzzysort from 'fuzzysort';

/**
 * Defines the keys used for fuzzy searching within customer objects.
 */
export type FuzzysortKeys = Array<
  'name' | 'email' | 'phone' | 'notes' | 'company'
>;

/**
 * Configuration options for fuzzysort, including the keys to search and a threshold.
 */
export const fuzzysortOptions: { keys: FuzzysortKeys; threshold: number } = {
  keys: ['name', 'email', 'phone', 'notes', 'company'],
  threshold: -700, // Adjust threshold as needed for search sensitivity.
};

/**
 * Generates CSV data from a list of customer contacts.
 * @param customers An array of Contact objects.
 * @returns A CSV string if customers exist, otherwise null.
 */
export const generateCustomerCSVData = (
  customers: Contact[],
): string | null => {
  if (customers.length === 0) {
    return null; // Return null if there are no customers to export.
  }

  // Define the fields to be included in the CSV.
  const fields = [
    'id',
    'name',
    'email',
    'phone',
    'company',
    'notes',
    'category',
  ];

  // Map customer objects to plain objects with only the desired fields.
  const data = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    notes: customer.notes,
    category: customer.category,
  }));

  // Use PapaParse to unparse the data into a CSV string.
  const csvData = Papa.unparse({
    fields: fields,
    data: data,
  });

  return csvData;
};

/**
 * Filters a list of customers based on a search query and selected category.
 * @param customers An array of Contact objects to filter.
 * @param searchQuery The search string to apply fuzzy matching against.
 * @param selectedCategory The category name to filter by, or null for all categories.
 * @returns A new array of filtered Contact objects.
 */
export const filterCustomers = (
  customers: Contact[],
  searchQuery: string,
  selectedCategory: string | null,
): Contact[] => {
  let results = customers;

  // Apply category filter if a category is selected.
  if (selectedCategory) {
    results = results.filter(
      (customer) =>
        customer.category === selectedCategory ||
        // Include uncategorized customers if 'Uncategorized' is selected.
        (!customer.category && selectedCategory === 'Uncategorized'),
    );
  }

  // Apply fuzzy search if a search query is provided.
  if (searchQuery) {
    results = fuzzysort
      .go(searchQuery, results, {
        keys: fuzzysortOptions.keys,
        threshold: fuzzysortOptions.threshold,
      })
      .map((result) => result.obj); // Extract the original object from fuzzysort result.
  }

  return results;
};
