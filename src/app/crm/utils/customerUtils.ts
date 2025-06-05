import type { Customer } from '../types';
import Papa from 'papaparse';
import fuzzysort from 'fuzzysort';

export type FuzzysortKeys = Array<
  'name' | 'email' | 'phone' | 'notes' | 'company'
>;

export const fuzzysortOptions: { keys: FuzzysortKeys; threshold: number } = {
  keys: ['name', 'email', 'phone', 'notes', 'company'],
  threshold: -700,
};

export const generateCustomerCSVData = (
  customers: Customer[],
): string | null => {
  if (customers.length === 0) {
    return null;
  }

  const csvData = Papa.unparse({
    fields: ['id', 'name', 'email', 'phone', 'company', 'notes', 'category'],
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      notes: customer.notes,
      category: customer.category,
    })),
  });

  return csvData;
};

export const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
  selectedCategory: string | null,
): Customer[] => {
  let results = customers;

  if (selectedCategory) {
    results = results.filter(
      (customer) =>
        customer.category === selectedCategory ||
        (!customer.category && selectedCategory === 'Uncategorized'),
    );
  }

  if (searchQuery) {
    results = fuzzysort
      .go(searchQuery, results, {
        keys: fuzzysortOptions.keys,
        threshold: fuzzysortOptions.threshold,
      })
      .map((result) => result.obj);
  }

  return results;
};
