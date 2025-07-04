import { useState, useEffect } from 'react';

interface InvoiceData {
  id: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}

const useInvoicingData = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Simulate API call
        setLoading(true);
        const response = await new Promise<InvoiceData[]>((resolve) =>
          setTimeout(() => {
            resolve([
              {
                id: '1',
                clientName: 'Client A',
                amount: 1500,
                status: 'pending',
                dueDate: '2024-07-15',
              },
              {
                id: '2',
                clientName: 'Client B',
                amount: 2500,
                status: 'paid',
                dueDate: '2024-06-30',
              },
              {
                id: '3',
                clientName: 'Client C',
                amount: 500,
                status: 'overdue',
                dueDate: '2024-06-01',
              },
            ]);
          }, 1000),
        );
        setInvoices(response);
      } catch (err) {
        setError('Failed to fetch invoicing data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return { invoices, loading, error };
};

export default useInvoicingData;
