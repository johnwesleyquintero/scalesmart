import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Copy, Edit, Trash2 } from 'lucide-react';

import type { Customer } from '../types';

interface CustomerListItemProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onCopyNotes: (notes: string) => void;
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({
  customer,
  onEdit,
  onDelete,
  onCopyNotes,
}) => {
  return (
    <Card className="w-full">
      <CardContent className="grid grid-cols-1 gap-2">
        <h3 className="text-lg font-semibold">{customer.name}</h3>
        <p className="text-muted-foreground">{customer.email}</p>
        <p className="text-muted-foreground">{customer.phone}</p>
        <p className="text-muted-foreground">Address: {customer.address}</p>
        {customer.notes && (
          <>
            <p className="font-semibold">Notes:</p>
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopyNotes(customer.notes || '')}
          title="Copy notes"
        >
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
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
