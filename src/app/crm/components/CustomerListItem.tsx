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
  onEdit: (customer: Contact) => void; // Callback for editing the customer.
  onDelete: (id: string) => void; // Callback for deleting the customer.
  onCopyNotes: (notes: string) => void; // Callback for copying customer notes.
  onCommunicationLogSaveAction: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>; // Callback to save a new communication log.
  onCommunicationLogUpdateAction: (log: CommunicationLog) => Promise<void>; // Callback to update an existing communication log.
  onCommunicationLogDeleteAction: (
    logId: string,
    customerId: string,
  ) => Promise<void>; // Callback to delete a communication log.
  onSelect: (id: string, isSelected: boolean) => void; // Callback for selecting/deselecting the customer.
  isSelected: boolean; // Boolean indicating if the customer is currently selected.
}

/**
 * CustomerListItem component.
 * Renders a card for a single customer with their details and actions.
 */
const CustomerListItem: React.FC<CustomerListItemProps> = ({
  customer,
  onEdit,
  onDelete,
  onCopyNotes,
  onCommunicationLogSaveAction,
  onCommunicationLogUpdateAction,
  onCommunicationLogDeleteAction,
  onSelect,
  isSelected,
}) => {
  // State to control the visibility of the communication log section.
  const [isLogOpen, setIsLogOpen] = useState(false);
  // State to store the serialized MDX content of customer notes.
  const [serializedNotes, setSerializedNotes] =
    useState<MDXRemoteSerializeResult | null>(null);

  /**
   * Effect to serialize MDX content from `customer.notes` on the client side.
   * This runs whenever `customer.notes` changes.
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
          setSerializedNotes(null); // Set to null to prevent rendering invalid MDX.
        }
      } else {
        setSerializedNotes(null); // Clear serialized notes if customer.notes is empty.
      }
    };

    serializeContent();
  }, [customer.notes]); // Dependency array ensures effect runs when notes change.

  /**
   * Memoized MDX components to prevent unnecessary re-renders of the MDX renderer.
   */
  const components = useMemo(() => mdxComponents, []);

  return (
    <Card className="w-full">
      <CardContent className="grid grid-cols-1 gap-2 pt-6 relative">
        {/* Checkbox for selecting the customer */}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(customer.id!, !!checked)}
            aria-label={`Select customer ${customer.name}`}
          />
        </div>
        {/* Customer basic information display */}
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
        {/* Display customer notes, rendering as MDX if serialization is successful */}
        {customer.notes && (
          <>
            <p className="font-semibold mt-2">Notes:</p>
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
      <CardFooter className="flex flex-wrap justify-end gap-2 p-4">
        {/* Action buttons for customer operations */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopyNotes(customer.notes || '')}
          title="Copy notes"
        >
          <Copy className="mr-2 h-4 w-4" /> Copy Notes
        </Button>
        {/* Collapsible section for communication logs */}
        <Collapsible
          open={isLogOpen}
          onOpenChange={setIsLogOpen}
          className="w-auto flex-grow"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" />
              {isLogOpen ? 'Hide' : 'View'} Communications
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="CollapsibleContent mt-4 w-full">
            {/* Communication log component for the current customer */}
            <CommunicationLogComponent
              customerId={customer.id!}
              logs={customer.communicationLogs || []}
              onSave={onCommunicationLogSaveAction}
              onUpdate={onCommunicationLogUpdateAction}
              onDelete={onCommunicationLogDeleteAction}
            />
          </CollapsibleContent>
        </Collapsible>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(customer)}
          title="Edit customer"
        >
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(customer.id!)}
          title="Delete customer"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export { CustomerListItem };
