import { CsvTransformerConfig } from '@/types/csv-transformer-config';

export const keywordTrackingConfig: CsvTransformerConfig = [
  {
    id: 'keyword',
    label: 'Keyword',
    aliases: ['Keyword', 'Search Term', 'Customer Search Term'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'rank',
    label: 'Rank',
    aliases: ['Rank', 'Keyword Rank', 'Organic Rank'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse rank value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'searchVolume',
    label: 'Search Volume',
    aliases: ['Search Volume', 'Monthly Search Volume'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(
          `Could not parse search volume value: "${value}". Using 0.`,
        );
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'competition',
    label: 'Competition',
    aliases: ['Competition', 'Keyword Competition'],
    transform: (value: unknown) => String(value || ''), // Or a numerical transformation if applicable
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
  // Add more relevant fields as needed based on common keyword tracking reports
];
