'use client';

/**
 * @file CommunicationLogsTab.tsx
 * @description This component displays a comprehensive list of all communication logs
 * across all customers. It provides filtering by communication type, searching by
 * subject, notes, or customer name, and sorting options.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contact, CommunicationLog } from '../types';
import useDebounce from '@/hooks/use-debounce';
import { COMMUNICATION_TYPES } from './CommunicationLog';

/**
 * Extends CommunicationLog to include the customer's name for display and filtering.
 */
type CommunicationLogWithCustomerName = CommunicationLog & {
  customerName: string;
};

/**
 * Props for the CommunicationLogsTab component.
 */
interface CommunicationLogsTabProps {
  customers: Contact[]; // Array of all customers, from which logs are extracted.
}

// Constants for communication type filter options.
const COMMUNICATION_TYPES_FILTER = [
  { value: 'All', label: 'All Types' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'chat', label: 'Chat' },
] as const;

// Constants for sorting options.
const SORT_BY_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'type', label: 'Type' },
  { value: 'customerName', label: 'Customer Name' },
] as const;

// Constants for sort order options.
const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
] as const;

// Derived types for strict type checking of filter and sort options.
type CommunicationTypeFilter =
  (typeof COMMUNICATION_TYPES_FILTER)[number]['value'];
type SortByOption = (typeof SORT_BY_OPTIONS)[number]['value'];
type SortOrderOption = (typeof SORT_ORDER_OPTIONS)[number]['value'];

/**
 * CommunicationLogsTab component.
 * Displays and manages a global view of all communication logs.
 */
export const CommunicationLogsTab: React.FC<CommunicationLogsTabProps> = ({
  customers,
}) => {
  // State for search query input.
  const [searchQuery, setSearchQuery] = useState('');
  // Debounced search query to prevent excessive re-renders during typing.
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  // State for selected communication type filter.
  const [selectedType, setSelectedType] =
    useState<CommunicationTypeFilter>('All');
  // State for selected sorting criterion.
  const [sortBy, setSortBy] = useState<SortByOption>('date');
  // State for selected sort order (ascending/descending).
  const [sortOrder, setSortOrder] = useState<SortOrderOption>('desc');

  /**
   * Memoized aggregation of all communication logs from all customers.
   * Each log is augmented with the `customerName` for easier display and filtering.
   * Recalculates only when the `customers` array changes.
   */
  const allLogs: CommunicationLogWithCustomerName[] = useMemo(() => {
    return customers.flatMap((customer: Contact) =>
      (customer.communicationLogs || []).map((log: CommunicationLog) => ({
        ...log,
        customerName: customer.name,
      })),
    );
  }, [customers]);

  /**
   * Memoized filtering of logs based on selected type and search query.
   * Uses `fuzzysort` for fuzzy searching across multiple fields.
   * Recalculates only when `allLogs`, `selectedType`, or `debouncedSearchQuery` changes.
   */
  const filteredLogs = useMemo(() => {
    let results = allLogs;

    // Apply type filter.
    if (selectedType !== 'All') {
      results = results.filter((log) => log.type === selectedType);
    }

    // Apply fuzzy search if a query is present.
    if (debouncedSearchQuery) {
      const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
      results = results.filter((log) => {
        return (
          log.subject?.toLowerCase().includes(lowerCaseQuery) ||
          log.notes.toLowerCase().includes(lowerCaseQuery) ||
          log.customerName.toLowerCase().includes(lowerCaseQuery)
        );
      });
    }

    return results;
  }, [allLogs, selectedType, debouncedSearchQuery]);

  /**
   * Memoized sorting of filtered logs based on `sortBy` and `sortOrder`.
   * Recalculates only when `filteredLogs`, `sortBy`, or `sortOrder` changes.
   */
  const sortedLogs = useMemo(() => {
    // Create a shallow copy to avoid mutating the original `filteredLogs` array.
    return [...filteredLogs].sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' ? b.date - a.date : a.date - b.date;
      }
      if (sortBy === 'type') {
        return sortOrder === 'desc'
          ? b.type.localeCompare(a.type)
          : a.type.localeCompare(b.type);
      }
      if (sortBy === 'customerName') {
        return sortOrder === 'desc'
          ? b.customerName.localeCompare(a.customerName)
          : a.customerName.localeCompare(b.customerName);
      }
      return 0; // Should not be reached if sortBy is always one of the defined options.
    });
  }, [filteredLogs, sortBy, sortOrder]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">
          All Communication Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="search"
            placeholder="Search logs (subject, notes, customer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
            aria-label="Search communication logs" // Added accessibility label
          />
          <Select
            value={selectedType}
            onValueChange={(value: CommunicationTypeFilter) =>
              setSelectedType(value)
            }
          >
            <SelectTrigger
              className="w-full sm:w-[180px]"
              aria-label="Filter by communication type"
            >
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              {COMMUNICATION_TYPES_FILTER.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value: SortByOption) => setSortBy(value)}
          >
            <SelectTrigger
              className="w-full sm:w-[180px]"
              aria-label="Sort by criterion"
            >
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_BY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value: SortOrderOption) => setSortOrder(value)}
          >
            <SelectTrigger
              className="w-full sm:w-[150px]"
              aria-label="Sort order"
            >
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              {SORT_ORDER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Display filtered and sorted logs or a message if none are found */}
        {sortedLogs.length === 0 ? (
          <p className="text-muted-foreground">
            {allLogs.length === 0
              ? 'No communication logs recorded across all customers.'
              : 'No communication logs match your criteria.'}
          </p>
        ) : (
          <div className="space-y-4">
            {sortedLogs.map((log) => (
              <Card key={`${log.customerId}-${log.id}`} className="p-4">
                <p className="text-sm text-muted-foreground">
                  {/* Display formatted date, type, and customer name */}
                  {new Date(log.date).toLocaleString()} - {log.type} for{' '}
                  <strong>{log.customerName}</strong>
                </p>
                {log.subject && (
                  <p className="font-semibold text-foreground">{log.subject}</p>
                )}
                <p className="whitespace-pre-wrap text-foreground">
                  {log.notes}
                </p>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
