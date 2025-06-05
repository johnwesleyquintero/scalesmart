import React, { useState, useEffect, useMemo } from 'react'; // Import useEffect and useMemo
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
import { MDXRemoteSerializeResult } from 'next-mdx-remote'; // Keep type import
import dynamic from 'next/dynamic';

import type { Customer, CommunicationLog } from '../types';
import CommunicationLogComponent from './CommunicationLog';
import { components as mdxComponents } from '@/components/MdxRenderer'; // Import mdxComponents

// Dynamically import MDXRemote to ensure it's client-side rendered
// This resolves the ESM import issue during the Next.js build process.
const ClientSideMDXRemote = dynamic(
  async () => {
    const { MDXRemote } = await import('next-mdx-remote');
    return MDXRemote;
  },
  { ssr: false },
);

interface CustomerListItemProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onCopyNotes: (notes: string) => void;
  onCommunicationLogSave: (log: Omit<CommunicationLog, 'id'>) => Promise<void>;
  onCommunicationLogUpdate: (log: CommunicationLog) => Promise<void>;
  onCommunicationLogDelete: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
  onSelect: (id: string, isSelected: boolean) => void;
  isSelected: boolean;
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({
  customer,
  onEdit,
  onDelete,
  onCopyNotes,
  onCommunicationLogSave,
  onCommunicationLogUpdate,
  onCommunicationLogDelete,
  onSelect,
  isSelected,
}) => {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [serializedNotes, setSerializedNotes] =
    useState<MDXRemoteSerializeResult | null>(null);

  // Use useEffect to serialize MDX content on the client side
  // This is triggered whenever customer.notes changes.
  useEffect(() => {
    const serializeContent = async () => {
      if (customer.notes) {
        try {
          // Import serialize here to ensure it's only used client-side
          const { serialize } = await import('next-mdx-remote/serialize');
          const mdx = await serialize(customer.notes);
          setSerializedNotes(mdx);
        } catch (error) {
          console.error('Error serializing MDX content:', error);
          setSerializedNotes(null); // Handle error by not rendering MDX
        }
      } else {
        setSerializedNotes(null);
      }
    };

    serializeContent();
  }, [customer.notes]); // Dependency array ensures effect runs when notes change

  // Memoize the MDX components to prevent unnecessary re-renders
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
        {/* Customer basic information */}
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
        {/* Display customer notes, rendering as MDX if serialized successfully */}
        {customer.notes && (
          <>
            <p className="font-semibold mt-2">Notes:</p>
            {serializedNotes ? (
              <div className="prose dark:prose-invert text-sm text-muted-foreground">
                <ClientSideMDXRemote
                  {...serializedNotes}
                  components={components} // Use memoized components
                />
              </div>
            ) : (
              // Fallback to plain text if MDX serialization fails or notes are not MDX
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 p-4">
        {/* Action buttons */}
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
            {/* Communication log component */}
            <CommunicationLogComponent
              customerId={customer.id!}
              logs={customer.communicationLogs || []}
              onSave={onCommunicationLogSave}
              onUpdate={onCommunicationLogUpdate}
              onDelete={onCommunicationLogDelete}
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
