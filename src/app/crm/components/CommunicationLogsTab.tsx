'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Customer } from '../types';

interface CommunicationLogsTabProps {
  customers: Customer[];
}

export const CommunicationLogsTab: React.FC<CommunicationLogsTabProps> = ({
  customers,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Communication Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {customers.flatMap((customer) => customer.communicationLogs || [])
          .length === 0 ? (
          <p className="text-muted-foreground">
            No communication logs recorded across all customers.
          </p>
        ) : (
          <div className="space-y-4">
            {customers
              .flatMap((customer) =>
                (customer.communicationLogs || []).map((log) => ({
                  ...log,
                  customerName: customer.name,
                })),
              )
              .sort((a, b) => b.date - a.date)
              .map((log) => (
                <Card key={`${log.customerId}-${log.id}`} className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {new Date(log.date).toLocaleString()} - {log.type} for{' '}
                    <strong>{log.customerName}</strong>
                  </p>
                  {log.subject && (
                    <p className="font-semibold">{log.subject}</p>
                  )}
                  <p className="whitespace-pre-wrap">{log.notes}</p>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
