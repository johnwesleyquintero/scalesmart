import { CsvRow } from '@/lib/amazon-tools/types';

export interface KeywordAnalysisResult {
  keyword: string;
  isProhibited: boolean;
}
import Papa from 'papaparse';

export interface ListingData {
  product: string;
  title: string;
  description: string;
  bulletPoints: string[];
  images: number;
  keywords: string[];
  keywordAnalysis?: KeywordAnalysisResult[];
  score: number;
  issues: string[];
  suggestions: string[];
  brand?: string;
  rating?: number;
  reviewCount?: number;
}

// Constants
const REQUIRED_COLUMNS = [
  'product',
  'title',
  'description',
  'bullet_points',
  'images',
  'keywords',
] as const;

// Scoring Weights
const WEIGHTS = {
  title: 20,
  description: 20,
  bulletPoints: 15,
  images: 15,
  keywords: 15,
  brand: 5,
  rating: 5,
  reviewCount: 5,
} as const;

// Thresholds for scoring
const MIN_TITLE_LENGTH = 50;
const MAX_TITLE_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_BULLET_POINTS = 3;
const RECOMMENDED_BULLET_POINTS = 5;
const MIN_IMAGES = 3;
const RECOMMENDED_IMAGES = 7;
const MIN_KEYWORDS = 5;
const RECOMMENDED_KEYWORDS = 10;
const MIN_REVIEW_COUNT = 10;
const MIN_RATING = 3.5;

type ListingScoreResult = Pick<ListingData, 'score' | 'issues' | 'suggestions'>;

// Helper functions to calculate scores for different aspects
const calculateTitleScore = (
  title: string | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let titleScore = 0;
  if (title) {
    if (title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH) {
      titleScore = WEIGHTS.title;
    } else if (title.length < MIN_TITLE_LENGTH) {
      issues.push(
        `Title too short (${title.length}/${MIN_TITLE_LENGTH} chars)`,
      );
      suggestions.push('Expand title with relevant keywords and key features.');
      titleScore = Math.floor(
        (title.length / MIN_TITLE_LENGTH) * WEIGHTS.title,
      );
    } else {
      issues.push(
        `Title exceeds maximum length (${title.length}/${MAX_TITLE_LENGTH} chars)`,
      );
      suggestions.push(
        'Optimize title length while maintaining key information.',
      );
      titleScore = Math.floor(
        (MAX_TITLE_LENGTH / title.length) * WEIGHTS.title,
      );
    }
  } else {
    issues.push('Missing product title');
    suggestions.push('Add a descriptive title with main keywords.');
  }
  return titleScore;
};

const calculateDescriptionScore = (
  description: string | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let descScore = 0;
  if (description) {
    if (
      description.length >= MIN_DESCRIPTION_LENGTH &&
      description.length <= MAX_DESCRIPTION_LENGTH
    ) {
      descScore = WEIGHTS.description;
    } else if (description.length < MIN_DESCRIPTION_LENGTH) {
      issues.push(
        `Description too short (${description.length}/${MIN_DESCRIPTION_LENGTH} chars)`,
      );
      suggestions.push('Expand description with detailed product information.');
      descScore = Math.floor(
        (description.length / MIN_DESCRIPTION_LENGTH) * WEIGHTS.description,
      );
    } else {
      issues.push(
        `Description exceeds recommended length (${description.length}/${MAX_DESCRIPTION_LENGTH} chars)`,
      );
      suggestions.push('Consider condensing while maintaining key details.');
      descScore = Math.floor(
        (MAX_DESCRIPTION_LENGTH / description.length) * WEIGHTS.description,
      );
    }
  } else {
    issues.push('Missing product description');
    suggestions.push('Add a comprehensive product description.');
  }
  return descScore;
};

const calculateBulletPointsScore = (
  bulletPoints: string[] | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let bulletScore = 0;
  const bulletCount = bulletPoints?.length ?? 0;
  if (bulletCount >= RECOMMENDED_BULLET_POINTS) {
    bulletScore = WEIGHTS.bulletPoints;
  } else if (bulletCount >= MIN_BULLET_POINTS) {
    bulletScore = Math.floor(
      (bulletCount / RECOMMENDED_BULLET_POINTS) * WEIGHTS.bulletPoints,
    );
    suggestions.push(
      `Consider adding ${RECOMMENDED_BULLET_POINTS - bulletCount} more bullet points.`,
    );
  } else {
    issues.push(
      `Insufficient bullet points (${bulletCount}/${MIN_BULLET_POINTS} minimum)`,
    );
    suggestions.push(
      `Add at least ${MIN_BULLET_POINTS - bulletCount} more bullet points.`,
    );
    bulletScore =
      bulletCount > 0
        ? Math.floor((bulletCount / MIN_BULLET_POINTS) * WEIGHTS.bulletPoints)
        : 0;
  }
  return bulletScore;
};

const calculateImagesScore = (
  images: number | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let imageScore = 0;
  const imageCount = images ?? 0;
  if (imageCount >= RECOMMENDED_IMAGES) {
    imageScore = WEIGHTS.images;
  } else if (imageCount >= MIN_IMAGES) {
    imageScore = Math.floor((imageCount / RECOMMENDED_IMAGES) * WEIGHTS.images);
    suggestions.push(
      `Consider adding ${RECOMMENDED_IMAGES - imageCount} more images.`,
    );
  } else {
    issues.push(`Insufficient images (${imageCount}/${MIN_IMAGES} minimum)`);
    suggestions.push(
      `Add at least ${MIN_IMAGES - imageCount} more high-quality images.`,
    );
    imageScore =
      imageCount > 0
        ? Math.floor((imageCount / MIN_IMAGES) * WEIGHTS.images)
        : 0;
  }
  return imageScore;
};

const calculateKeywordsScore = (
  keywords: string[] | undefined,
  keywordAnalysis: KeywordAnalysisResult[] | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let keywordScore = 0;
  if (keywords && keywords.length > 0) {
    const keywordCount = keywords.length;
    if (keywordCount >= RECOMMENDED_KEYWORDS) {
      keywordScore = WEIGHTS.keywords;
    } else if (keywordCount >= MIN_KEYWORDS) {
      keywordScore = Math.floor(
        (keywordCount / RECOMMENDED_KEYWORDS) * WEIGHTS.keywords,
      );
      suggestions.push(
        `Consider adding ${RECOMMENDED_KEYWORDS - keywordCount} more relevant keywords.`,
      );
    } else {
      issues.push(
        `Insufficient keywords (${keywordCount}/${MIN_KEYWORDS} minimum)`,
      );
      suggestions.push(
        `Add at least ${MIN_KEYWORDS - keywordCount} more relevant keywords.`,
      );
      keywordScore = Math.floor(
        (keywordCount / MIN_KEYWORDS) * WEIGHTS.keywords,
      );
    }

    // Check for prohibited keywords
    const prohibitedCount =
      keywordAnalysis?.filter((k) => k.isProhibited).length ?? 0;
    if (prohibitedCount > 0) {
      issues.push(`Found ${prohibitedCount} prohibited keywords`);
      suggestions.push('Remove or replace prohibited keywords.');
      keywordScore = Math.max(0, keywordScore - prohibitedCount * 2);
    }
  } else {
    issues.push('Missing keywords');
    suggestions.push('Add relevant keywords to improve searchability.');
  }
  return keywordScore;
};

// Enhanced scoring logic with weighted factors and comprehensive checks
export const calculateScoreAndIssues = (
  data: Omit<ListingData, 'score' | 'issues' | 'suggestions'>,
): ListingScoreResult => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;

  // Title Analysis (20 points)
  totalScore += calculateTitleScore(data.title, issues, suggestions);

  // Description Analysis (20 points)
  totalScore += calculateDescriptionScore(
    data.description,
    issues,
    suggestions,
  );

  // Bullet Points Analysis (15 points)
  totalScore += calculateBulletPointsScore(
    data.bulletPoints,
    issues,
    suggestions,
  );

  // Images Analysis (15 points)
  totalScore += calculateImagesScore(data.images, issues, suggestions);

  // Keywords Analysis (15 points)
  totalScore += calculateKeywordsScore(
    data.keywords,
    data.keywordAnalysis,
    issues,
    suggestions,
  );

  // Brand and Category Bonus (5 points each)
  if (data.brand) totalScore += WEIGHTS.brand;
  else suggestions.push('Add brand information if applicable.');

  // Rating and Review Analysis (5 points each)
  if (data.rating && data.rating >= MIN_RATING) {
    totalScore += WEIGHTS.rating;
  } else if (data.rating) {
    issues.push(`Low product rating (${data.rating.toFixed(1)}/5.0)`);
    suggestions.push('Address common customer concerns to improve rating.');
  }

  if (data.reviewCount && data.reviewCount >= MIN_REVIEW_COUNT) {
    totalScore += WEIGHTS.reviewCount;
  } else if (data.reviewCount) {
    suggestions.push('Work on getting more customer reviews.');
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)), // Ensure score is between 0 and 100
    issues: issues.length > 0 ? issues : [],
    suggestions: suggestions.length > 0 ? suggestions : [],
  };
};

export const validateCSVData = (results: Papa.ParseResult<CsvRow>) => {
  if (results.errors.length > 0) {
    throw new Error(
      `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
    );
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !results.meta.fields?.includes(col),
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
};
