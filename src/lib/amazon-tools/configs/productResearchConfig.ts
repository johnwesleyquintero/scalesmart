import { CsvTransformerConfig } from '@/types/csv-transformer-config';

export const productResearchConfig: CsvTransformerConfig = [
  {
    id: 'name',
    label: 'Product Name',
    aliases: ['Product Title', 'Title', 'Item Name'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'price',
    label: 'Price',
    aliases: ['Price', 'Current Price', 'Your Price'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse price value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'asin',
    label: 'ASIN',
    aliases: ['ASIN', '(Parent) ASIN', '(Child) ASIN', 'Product ASIN'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'brand',
    label: 'Brand',
    aliases: ['Brand', 'Brand Name'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'category',
    label: 'Category',
    aliases: ['Category', 'Product Category'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'reviews',
    label: 'Reviews',
    aliases: ['Customer Reviews', 'Number of Reviews'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse reviews value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'rating',
    label: 'Rating',
    aliases: ['Average Review Rating', 'Rating'],
    transform: (value: unknown) => {
      const parsedValue = parseFloat(String(value));
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse rating value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
];
