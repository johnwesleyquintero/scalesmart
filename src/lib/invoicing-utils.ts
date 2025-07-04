export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const calculateDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getInvoiceStatusColor = (
  status: 'paid' | 'pending' | 'overdue',
): string => {
  switch (status) {
    case 'paid':
      return 'text-green-500';
    case 'pending':
      return 'text-yellow-500';
    case 'overdue':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};
