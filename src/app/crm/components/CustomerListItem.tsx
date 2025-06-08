/**
 * @file CustomerListItem.tsx
 * @description This component displays a single customer's details within a list.
 * It includes options to edit, delete, copy notes, and view/manage communication logs.
 * It also supports MDX rendering for customer notes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Copy,
  Edit,
  Trash2,
  MessageCircle,
  ChevronsUpDown,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import dynamic from 'next/dynamic';

import type { Contact, CommunicationLog } from '../types';
import CommunicationLogComponent from './CommunicationLog';
import { components as mdxComponents } from '@/components/MdxRenderer';

// Dynamically import MDXRemote to ensure it's client-side rendered.
// This resolves potential issues with server-side rendering of MDX components.
const ClientSideMDXRemote = dynamic(
  async () => {
    const { MDXRemote } = await import('next-mdx-remote');
    return MDXRemote;
  },
  { ssr: false }, // Ensure this component is only rendered on the client side.
);

/**
 * Props for the CustomerListItem component.
 */
interface CustomerListItemProps {
  customer: Contact; // The customer object to display.
  handleEdit: (customer: Contact) => void;
  handleDelete: (id: string) => void;
  handleCopyNotes: (notes: string) => void;
  handleCommunicationLogSave: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>;
  handleCommunicationLogUpdate: (log: CommunicationLog) => Promise<void>;
  handleCommunicationLogDelete: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
  handleSelect: (id: string, isSelected: boolean) => void;
  isSelected: boolean; // Boolean indicating if the customer is currently selected.
}

/**
 * CustomerListItem component.
 * Renders a card for a single customer with their details and actions.
 */
const CustomerListItem: React.FC<CustomerListItemProps> = ({
  customer,
  handleEdit,
  handleDelete,
  handleCopyNotes,
  handleCommunicationLogSave,
  handleCommunicationLogUpdate,
  handleCommunicationLogDelete,
  handleSelect,
  isSelected,
}) => {
  // State to manage the visibility of the communication log section.
  const [isLogOpen, setIsLogOpen] = useState(false);
  // State to hold the serialized MDX content for rendering customer notes.
  const [serializedNotes, setSerializedNotes] =
    useState<MDXRemoteSerializeResult | null>(null);

  /**
   * Effect hook to handle the client-side serialization of customer notes written in MDX format.
   * This effect runs whenever the `customer.notes` prop changes.
   * It dynamically imports the `serialize` function from `next-mdx-remote/serialize`
   * to ensure it's only executed in the browser environment.
   * The serialized content is then stored in the `serializedNotes` state,
   * which is used by the `ClientSideMDXRemote` component for rendering.
   * Includes basic error handling for the serialization process.
   */
  useEffect(() => {
    const serializeContent = async () => {
      if (customer.notes) {
        try {
          // Dynamically import `serialize` to ensure it's only used client-side.
          const { serialize } = await import('next-mdx-remote/serialize');
          const mdx = await serialize(customer.notes);
          setSerializedNotes(mdx);
        } catch (error) {
          console.error('Error serializing MDX content:', error);
          // Set to null to prevent rendering invalid MDX and potentially display plain text fallback.
          setSerializedNotes(null);
        }
      } else {
        // Clear serialized notes if customer.notes is empty or null.
        setSerializedNotes(null);
      }
    };

    serializeContent();
  }, [customer.notes]); // Dependency array ensures effect runs when notes change.

  /**
   * Memoized object containing the custom components to be used by the MDX renderer.
   * Memoizing this object prevents unnecessary re-renders of the `ClientSideMDXRemote`
   * component when the parent component re-renders but the components themselves haven't changed.
   */
  const components = useMemo(() => mdxComponents, []);

  return (
    <Card className="w-full">
      {/* Card content area */}
      <CardContent className="grid grid-cols-1 gap-2 pt-6 relative">
        {/* Checkbox for selecting the customer */}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelect(customer.id!, !!checked)}
            aria-label={`Select customer ${customer.name}`}
          />
        </div>
        {/* Section displaying basic customer information */}
        <h3 className="text-lg font-semibold text-foreground pl-8">
          {customer.name}
        </h3>
        <p className="text-muted-foreground">{customer.email}</p>
        <p className="text-muted-foreground">{customer.phone}</p>
        {customer.company && (
          <p className="text-muted-foreground">Company: {customer.company}</p>
        )}
        {customer.category && (
          <p className="text-muted-foreground">Category: {customer.category}</p>
        )}
        {customer.address && (
          <p className="text-muted-foreground">Address: {customer.address}</p>
        )}
        {customer.salesStage && (
          <p className="text-muted-foreground">
            Sales Stage: {customer.salesStage}
          </p>
        )}
        {customer.lastContacted && (
          <p className="text-muted-foreground">
            Last Contacted: {new Date(customer.lastContacted).toLocaleString()}
          </p>
        )}
        {/* Section for displaying customer notes */}
        {customer.notes && (
          <>
            <p className="font-semibold mt-2">Notes:</p>
            {/* Conditionally render notes using MDXRemote if serialization is successful,
                otherwise fallback to plain text. */}
            {serializedNotes ? (
              <div className="prose dark:prose-invert text-sm text-muted-foreground">
                <ClientSideMDXRemote
                  {...serializedNotes}
                  components={components} // Use memoized components for MDX rendering.
                />
              </div>
            ) : (
              // Fallback to plain text if MDX serialization fails or notes are not MDX.
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            )}
          </>
        )}
      </CardContent>
      {/* Card footer area for action buttons and collapsible sections */}
      <CardFooter className="flex flex-wrap justify-end gap-2 p-4">
        {/* Button to copy customer notes to clipboard */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopyNotes(customer.notes || '')}
          title="Copy notes"
        >
          <Copy className="mr-2 h-4 w-4" /> Copy Notes
        </Button>
        {/* Collapsible section for viewing and managing communication logs */}
        <Collapsible
          open={isLogOpen}
          onOpenChange={setIsLogOpen}
          className="w-auto flex-grow"
        >
          {/* Trigger button for the collapsible communication log section */}
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" />
              {isLogOpen ? 'Hide' : 'View'} Communications
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          {/* Content area for the communication log component */}
          <CollapsibleContent className="CollapsibleContent mt-4 w-full">
            {/* Communication log component for the current customer */}
            <CommunicationLogComponent
              customerId={customer.id!}
              logs={customer.communicationLogs || []}
              onSave={handleCommunicationLogSave}
              onUpdate={handleCommunicationLogUpdate}
              onDelete={handleCommunicationLogDelete}
            />
          </CollapsibleContent>
        </Collapsible>
        {/* Button to trigger editing the customer */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(customer)}
          title="Edit customer"
        >
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
        {/* Button to trigger deleting the customer */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(customer.id!)}
          title="Delete customer"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export { CustomerListItem };
