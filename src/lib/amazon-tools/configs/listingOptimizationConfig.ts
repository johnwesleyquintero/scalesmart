import { CsvTransformerConfig } from '@/types/csv-transformer-config';

export const listingOptimizationConfig: CsvTransformerConfig = [
  {
    id: 'title',
    label: 'Title',
    aliases: ['Product Title', 'Title', 'Item Name'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'bulletPoints',
    label: 'Bullet Points',
    aliases: ['Bullet Points', 'Key Product Features', 'Feature Bullets'],
    transform: (value: unknown) =>
      String(value || '')
        .split(/[\n\r]+/) // Split by newline or carriage return
        .map((point) => point.trim())
        .filter(Boolean), // Remove empty strings
  },
  {
    id: 'description',
    label: 'Description',
    aliases: ['Product Description', 'Description', 'Item Description'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'backendKeywords',
    label: 'Backend Keywords',
    aliases: ['Search Terms', 'Backend Search Terms'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'subjectMatter',
    label: 'Subject Matter',
    aliases: ['Subject Matter'],
    transform: (value: unknown) => String(value || ''),
  },
  // Add more relevant fields as needed based on common listing optimization reports
];
