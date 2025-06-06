'use client';

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
import type { Customer, CommunicationLog } from '../types';
import useDebounce from '@/hooks/use-debounce';
import fuzzysort from 'fuzzysort';

type CommunicationLogWithCustomerName = CommunicationLog & {
  customerName: string;
};

interface CommunicationLogsTabProps {
  customers: Customer[];
}

const COMMUNICATION_TYPES_FILTER = [
  { value: 'All', label: 'All Types' },
  { value: 'Call', label: 'Call' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Other', label: 'Other' },
] as const;

const SORT_BY_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'type', label: 'Type' },
  { value: 'customerName', label: 'Customer Name' },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
] as const;

type CommunicationTypeFilter =
  (typeof COMMUNICATION_TYPES_FILTER)[number]['value'];
type SortByOption = (typeof SORT_BY_OPTIONS)[number]['value'];
type SortOrderOption = (typeof SORT_ORDER_OPTIONS)[number]['value'];

export const CommunicationLogsTab: React.FC<CommunicationLogsTabProps> = ({
  customers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedType, setSelectedType] =
    useState<CommunicationTypeFilter>('All');
  const [sortBy, setSortBy] = useState<SortByOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrderOption>('desc');

  const allLogs: CommunicationLogWithCustomerName[] = useMemo(() => {
    return customers.flatMap((customer) =>
      (customer.communicationLogs || []).map((log) => ({
        ...log,
        customerName: customer.name,
      })),
    );
  }, [customers]);

  const filteredLogs = useMemo(() => {
    let results = allLogs;

    if (selectedType !== 'All') {
      results = results.filter((log) => log.type === selectedType);
    }

    if (debouncedSearchQuery) {
      results = fuzzysort
        .go(debouncedSearchQuery, results, {
          keys: ['subject', 'notes', 'customerName'],
          threshold: -700, // Adjust threshold as needed
        })
        .map((result) => result.obj);
    }

    return results;
  }, [allLogs, selectedType, debouncedSearchQuery]);

  const sortedLogs = useMemo(() => {
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
      return 0;
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="search"
            placeholder="Search logs (subject, notes, customer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Select
            value={selectedType}
            onValueChange={(value: CommunicationTypeFilter) =>
              setSelectedType(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[150px]">
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
