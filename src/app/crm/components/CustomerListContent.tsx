'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { CustomerListItem } from './CustomerListItem';
import type { Contact, CommunicationLog } from '../types';

interface CustomerListContentProps {
  customers: Contact[];
  searchQuery: string;
  hasAttemptedInitialLoad: boolean;
  onEditAction: (customer: Contact) => void;
  onDeleteAction: (id: string) => void;
  onCopyNotesAction: (notes: string) => void;
  itemsPerPage: number;
  currentPage: number;
  onCommunicationLogSaveAction: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>;
  onCommunicationLogUpdateAction: (log: CommunicationLog) => Promise<void>;
  onCommunicationLogDeleteAction: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
  selectedCustomerIds: string[];
  onSelectAction: (id: string, isSelected: boolean) => void;
}

/**
 * CustomerListContent component.
 * Renders the list of customers based on the current page and filters.
 * Displays empty state or loading indicator as needed.
 */
export const CustomerListContent: React.FC<CustomerListContentProps> = ({
  customers,
  searchQuery,
  hasAttemptedInitialLoad,
  onEditAction,
  onDeleteAction,
  onCopyNotesAction,
  itemsPerPage,
  currentPage,
  onCommunicationLogSaveAction,
  onCommunicationLogUpdateAction,
  onCommunicationLogDeleteAction,
  selectedCustomerIds,
  onSelectAction,
}) => {
  // Calculate the start and end index for the current page
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // Slice the customers array to get the customers for the current page
  const currentCustomers = customers.slice(startIndex, endIndex);

  // Render the list of customers if there are any on the current page
  if (currentCustomers.length > 0) {
    return (
      <div className="space-y-4">
        {currentCustomers.map((customer) => (
          <CustomerListItem
            key={`customer-card-${customer.id}`} // Unique key for list items
            customer={customer}
            handleEdit={onEditAction}
            handleDelete={onDeleteAction}
            handleCopyNotes={onCopyNotesAction}
            handleCommunicationLogSave={onCommunicationLogSaveAction}
            handleCommunicationLogUpdate={onCommunicationLogUpdateAction}
            handleCommunicationLogDelete={onCommunicationLogDeleteAction}
            handleSelect={onSelectAction}
            isSelected={
              // Check if the customer's ID is in the list of selected IDs
              customer.id ? selectedCustomerIds.includes(customer.id) : false
            }
          />
        ))}
      </div>
    );
  }

  // Determine the content to display when the customer list is empty
  let emptyStateContent;
  if (searchQuery) {
    // Display message if no customers match the search query
    emptyStateContent = 'No customers match your search.';
  } else if (hasAttemptedInitialLoad) {
    // Display message if no customers have been added yet after initial load attempt
    emptyStateContent = 'No customers added yet.';
  } else {
    // Display a loading spinner while waiting for the initial load attempt
    emptyStateContent = <Loader2 className="h-4 w-4 animate-spin" />;
  }

  // Render the empty state content
  return (
    <p className="text-muted-foreground text-center">{emptyStateContent}</p>
  );
};
