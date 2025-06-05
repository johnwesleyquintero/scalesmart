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

export const CommunicationLogsTab: React.FC<CommunicationLogsTabProps> = ({
  customers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedType, setSelectedType] = useState<
    'All' | 'Call' | 'Email' | 'Meeting' | 'Other'
  >('All');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'customerName'>(
    'date',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
            onValueChange={(
              value: 'All' | 'Call' | 'Email' | 'Meeting' | 'Other',
            ) => setSelectedType(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" label="All Types">
                All Types
              </SelectItem>
              <SelectItem value="Call" label="Call">
                Call
              </SelectItem>
              <SelectItem value="Email" label="Email">
                Email
              </SelectItem>
              <SelectItem value="Meeting" label="Meeting">
                Meeting
              </SelectItem>
              <SelectItem value="Other" label="Other">
                Other
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value: 'date' | 'type' | 'customerName') =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date" label="Date">
                Date
              </SelectItem>
              <SelectItem value="type" label="Type">
                Type
              </SelectItem>
              <SelectItem value="customerName" label="Customer Name">
                Customer Name
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc" label="Descending">
                Descending
              </SelectItem>
              <SelectItem value="asc" label="Ascending">
                Ascending
              </SelectItem>
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
