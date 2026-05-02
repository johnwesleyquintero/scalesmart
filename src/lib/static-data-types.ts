import { BlogPost } from '@/types';
export type { BlogPost };

export interface StaticDataTypes {
  'case-studies': CaseStudy[];
  blog: BlogPost[];
  acos: AcosData[];
}

export interface AcosData {
  productName: string;
  campaign: string;
  adSpend: number;
  sales: number;
  clicks: number;
  impressions: number;
}

export type MetricType =
  | 'price'
  | 'rating'
  | 'reviews'
  | 'sales_volume'
  | 'market_share';

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  metrics: {
    name: string;
    value: number;
    change: number;
    trend: string;
  }[];
  competitorData: unknown[];
  date: string;
  tags: string[];
}
