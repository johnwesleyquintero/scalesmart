import { BlogPost, DocPost } from '@/types';
export type { BlogPost, DocPost };

export interface StaticDataTypes {
  'case-studies': CaseStudy[];
  blog: BlogPost[];
  docs: DocPost[];
  projects: Project[];
  experience: Experience[];
  changelog: ChangelogEntry[];
  acos: AcosData[];
  'prohibited-keywords': string[];
  skills: SkillItem[];
  education: Education[];
  personal: PersonalInfo;
}

export interface SkillItem {
  name: string;
  level: number;
  icon: string;
}

export interface AcosData {
  productName: string;
  campaign: string;
  adSpend: number;
  sales: number;
  clicks: number;
  impressions: number;
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
    trend: string;
  }[];
  competitorData: unknown[];
  date: string;
  tags: string[];
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
  title: string;
  startDate: string;
  endDate: string | null;
  description: string[];
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
  description?: string;
  skills?: string[];
}

export interface PersonalInfo {
  name: string;
  avatar: string;
  email: string;
  location: string;
  phone: string;
  amazonProfile: {
    sellerCentral: { role: string; link: string };
    developerCentral: { role: string; link: string };
  };
  professionalSummary: {
    title: string;
    tagline: string;
    description: string;
  };
  expertise: {
    technicalExpert: string[];
    technicalAdvanced: string[];
    softSkills: string[];
  };
  operatingPrinciples?: {
    title: string;
    description: string;
  }[];
  dailyRhythm?: {
    title: string;
    description: string;
    tasks: string[];
  }[];
}

