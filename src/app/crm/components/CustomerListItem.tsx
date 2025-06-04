import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import {
  Copy,
  Edit,
  Trash2,
  MessageCircle,
  ChevronsUpDown,
} from 'lucide-react'; // Import new icons
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'; // Import Collapsible components
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { components as mdxComponents } from '@/components/MdxRenderer'; // Renamed to avoid conflict
import dynamic from 'next/dynamic'; // Import dynamic

import type { Customer, CommunicationLog } from '../types';
import CommunicationLogComponent from './CommunicationLog'; // Import the new component

// Dynamically import MDXRemote to ensure it's client-side rendered
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
  onSelect: (id: string, isSelected: boolean) => void; // Add onSelect prop
  isSelected: boolean; // Add isSelected prop
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({
  customer,
  onEdit,
  onDelete,
  onCopyNotes,
  onCommunicationLogSave,
  onCommunicationLogUpdate,
  onCommunicationLogDelete,
  onSelect, // Include in destructuring
  isSelected, // Include in destructuring
}) => {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [serializedNotes, setSerializedNotes] =
    useState<MDXRemoteSerializeResult | null>(null);

  React.useEffect(() => {
    const serializeContent = async () => {
      if (customer.notes) {
        try {
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
  }, [customer.notes]);

  return (
    <Card className="w-full">
      <CardContent className="grid grid-cols-1 gap-2 pt-6 relative">
        {' '}
        {/* Added relative for checkbox positioning */}
        <div className="absolute top-2 left-2">
          {' '}
          {/* Position checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(customer.id!, !!checked)}
            aria-label={`Select customer ${customer.name}`}
          />
        </div>
        <h3 className="text-lg font-semibold text-foreground pl-8">
          {' '}
          {/* Added padding to title */}
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
        {customer.notes && (
          <>
            <p className="font-semibold mt-2">Notes:</p>
            {serializedNotes ? (
              <div className="prose dark:prose-invert text-sm text-muted-foreground">
                <ClientSideMDXRemote
                  {...serializedNotes}
                  components={mdxComponents}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopyNotes(customer.notes || '')}
          title="Copy notes"
        >
          <Copy className="mr-2 h-4 w-4" /> Copy Notes
        </Button>
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
