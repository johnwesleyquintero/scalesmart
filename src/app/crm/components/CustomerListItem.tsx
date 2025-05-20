'use client';

import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import ReactMarkdown, { Options as ReactMarkdownOptions } from 'react-markdown';
import { memo } from 'react';
import type { Customer } from '../types';
import remarkGfm from 'remark-gfm';

interface MemoizedReactMarkdownProps {
  children: ReactMarkdownOptions['children'];
  options?: ReactMarkdownOptions;
}

// Memoize ReactMarkdown to prevent re-renders if props haven't changed
const MemoizedReactMarkdown = memo<MemoizedReactMarkdownProps>(ReactMarkdown);

interface CustomerListItemProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onCopyNotes: (notes: string) => void;
}

const CustomerListItemComponent = ({
  customer,
  onEdit,
  onDelete,
  onCopyNotes,
}: CustomerListItemProps) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{customer.name}</h3>
          <p className="text-muted-foreground">{customer.email}</p>
          {customer.phone && (
            <p className="text-muted-foreground">{customer.phone}</p>
          )}
          {customer.category && (
            <p className="text-xs mt-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full inline-block">
              {customer.category}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
            Edit
          </Button>
          {customer.notes && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyNotes(customer.notes)}
              title="Copy notes as Markdown"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(customer.id)}
          >
            Delete
          </Button>
        </div>
      </div>
      {customer.notes && (
        <div className="mt-2">
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <MemoizedReactMarkdown
              options={{
                remarkPlugins: [remarkGfm], // Default to GFM
              }}
            >
              {customer.notes}
            </MemoizedReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export const CustomerListItem = memo(CustomerListItemComponent);
