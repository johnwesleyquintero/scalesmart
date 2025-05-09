import { CompetitorDataRow } from './amazon-types';

export interface StaticDataTypes {
  'case-studies': CaseStudy[];
  blog: BlogPost[];
  projects: Project[];
  experience: Experience[];
  tools: Tool[];
  changelog: ChangelogEntry[];
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

export interface Tool {
  name: string;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  changes: string[];
  date: string;
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
    trend: 'up' | 'down' | 'neutral';
  }[];
  competitorData: CompetitorDataRow[];
  date: string;
  tags: string[];
}
export interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  date: string;
  image?: string;
  tags: string[];
  // Removed duplicate relatedPosts property
  readingTime?: string;
  author?: string;
  relatedPosts: RelatedPost[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  image?: string;
  link?: string;
  github?: string;
  featured: boolean;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string[];
  technologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Skill {
  category: string;
  items: {
    name: string;
    level: number;
  }[];
}

export interface PersonalInfo {
  name: string;
  title: string;
  description: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  twitter?: string;
}
