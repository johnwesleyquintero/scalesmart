export type DifficultyLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert';

export type CredentialTrack = 'amazon-aligned' | 'operator-credential';

export interface Certification {
  id: string;
  slug: string;
  title: string;
  track: CredentialTrack;
  level: DifficultyLevel;
  duration: string;
  modulesCount: number;
  assessmentsCount: number;
  shortDescription: string;
  description: string;
  topics: string[];
  operatorFocus?: string;
  featured?: boolean;
  image?: string;
  badgeLabel?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  level: DifficultyLevel;
  duration: string;
  description: string;
  modulesCount: number;
  source: 'Amazon Ads Academy' | 'ScaleSmart Operator Labs';
  topics: string[];
  operatorTakeaway: string;
  featured?: boolean;
}

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: DifficultyLevel;
  estimatedTime: string;
  stepsCount: number;
  steps: {
    title: string;
    type: 'course' | 'scenario' | 'assessment' | 'certification';
    description: string;
  }[];
  targetCredential: string;
}

export interface AcademyFAQ {
  id: string;
  question: string;
  answer: string;
  category?: 'general' | 'certifications' | 'scenarios' | 'badges';
}
