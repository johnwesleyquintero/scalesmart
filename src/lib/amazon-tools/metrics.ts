import { logError } from '@/lib/error-handling';
import { monetaryValueSchema, numberSchema } from '@/lib/input-validation';
import type { MetricKey } from '@/lib/amazon-tools/types';

// --- Interfaces & Types ---

export interface CampaignData {
  campaign: string;
  adSpend: number;
  sales: number;
  impressions?: number;
  clicks?: number;
  acos?: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  revenuePerClickRate?: number;
  date?: string;
  currencySymbol?: string;
}
