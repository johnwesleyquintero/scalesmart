import { CsvTransformerConfig } from '@/types/csv-transformer-config';

export const analyticsConfig: CsvTransformerConfig = [
  {
    id: 'date',
    label: 'Date',
    aliases: ['Date', 'Order Date', 'Ship Date'],
    transform: (value: unknown) => {
      const dateStr = String(value || '').trim();
      if (!dateStr) {
        console.warn(`Empty date value encountered. Returning empty string.`);
        return ''; // Or handle as null/undefined depending on requirements
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(
          `Could not parse date value: "${value}". Returning original string.`,
        );
        return dateStr; // Return original string if parsing fails
      }
      return date.toISOString().split('T')[0]; // Return ISO date string
    },
  },
  {
    id: 'totalSales',
    label: 'Total Sales',
    aliases: ['Total Sales', 'Sales', 'Product Sales'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse total sales value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'unitsSold',
    label: 'Units Sold',
    aliases: ['Units Sold', 'Units Ordered', 'Quantity'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse units sold value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'acos',
    label: 'ACoS',
    aliases: ['ACoS', 'Advertising Cost of Sales'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse ACoS value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'roas',
    label: 'ROAS',
    aliases: ['ROAS', 'Return on Ad Spend'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse ROAS value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'impressions',
    label: 'Impressions',
    aliases: ['Impressions'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse impressions value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'clicks',
    label: 'Clicks',
    aliases: ['Clicks'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse clicks value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'cpc',
    label: 'CPC',
    aliases: ['CPC', 'Cost Per Click'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse CPC value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  // salesTrend is calculated from aggregated data, not directly from a single column
];
