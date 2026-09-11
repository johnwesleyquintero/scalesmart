export type DifficultyLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert';

export type CredentialTrack = 'amazon-aligned' | 'operator-credential';
export type CourseSource = 'Amazon Ads Academy' | 'ScaleSmart Operator Labs';

export const CREDENTIAL_TRACKS = {
  AMAZON_ALIGNED: 'amazon-aligned' as const,
  OPERATOR_CREDENTIAL: 'operator-credential' as const,
} satisfies Record<string, CredentialTrack>;

export const COURSE_SOURCES = {
  AMAZON_ACADEMY: 'Amazon Ads Academy' as const,
  SCALESMART_LABS: 'ScaleSmart Operator Labs' as const,
} satisfies Record<string, CourseSource>;

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
  source: CourseSource;
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
