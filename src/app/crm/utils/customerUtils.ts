/**
 * @file customerUtils.ts
 * @description This file contains utility functions for managing customer data,
 * including filtering, searching, and exporting to CSV.
 */

import type { Contact, SalesStage } from '../types'; // Import SalesStage
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
    'salesStage', // Add salesStage to CSV fields
    'lastContacted', // Add lastContacted to CSV fields
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
    salesStage: customer.salesStage, // Include salesStage
    lastContacted: customer.lastContacted // Include lastContacted
      ? new Date(customer.lastContacted).toISOString()
      : '', // Format timestamp for CSV
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
 * @param selectedSalesStage The sales stage to filter by, or null for all stages.
 * @returns A new array of filtered Contact objects.
 */
export const filterCustomers = (
  customers: Contact[],
  searchQuery: string,
  selectedCategory: string | null,
  selectedSalesStage: SalesStage | null, // Add new parameter
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

  // Apply sales stage filter if a stage is selected.
  if (selectedSalesStage) {
    results = results.filter(
      (customer) => customer.salesStage === selectedSalesStage,
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
