import { parse } from 'node-html-parser';
import { type ProductListingData } from '../amazon-types';
import {
  defaultScoringConfig,
  type ScoringConfig,
  type ScoringRule,
  type BulletPointsScoringInput,
  type ReviewsScoringInput,
} from './scoring-config';

/**
 * Interface for the result of calculating a product's quality score.
 */
export interface ProductScore {
  overall: number;
  breakdown: {
    title: number;
    bulletPoints: number;
    description: number;
    images: number;
    reviews: number;
    aPlus: number;
    fulfillment: number;
  };
  suggestions: string[];
  messages: Record<string, string>;
}

/**
 * Defines the structure for suggestion and message generation based on score.
 */
interface ScoreFeedback {
  suggestion?: string;
  getMessage: (config: ScoringConfig, score: number) => string;
}

/**
 * A map to store feedback (suggestions and messages) for different scoring keys.
 * Keys are `ScoringConfig` keys, values are objects with `lowScore` and `highScore` feedback.
 */
const scoreFeedbackMap: Record<
  keyof ScoringConfig,
  {
    lowScore: ScoreFeedback;
    highScore: ScoreFeedback;
  }
> = {
  title: {
    lowScore: {
      suggestion:
        'Optimize title length (150-200 characters) with relevant keywords.',
      getMessage: (config) =>
        config.title.thresholds.find((t) => t.score < 7)?.message ||
        'Title needs improvement.',
    },
    highScore: {
      getMessage: (config) =>
        config.title.thresholds.find((t) => t.score >= 7)?.message ||
        'Title is good.',
    },
  },
  bulletPoints: {
    lowScore: {
      suggestion:
        'Add 5 bullet points, each 150-200 characters, highlighting key features.',
      getMessage: () => 'Improve bullet points quantity and/or length.',
    },
    highScore: {
      getMessage: () => 'Bullet points are well-structured.',
    },
  },
  description: {
    lowScore: {
      suggestion:
        'Expand description to 2000+ characters with proper HTML formatting.',
      getMessage: (config) =>
        config.description.thresholds.find((t) => t.score < 7)?.message ||
        'Description needs improvement.',
    },
    highScore: {
      getMessage: (config) =>
        config.description.thresholds.find((t) => t.score >= 7)?.message ||
        'Description is good.',
    },
  },
  images: {
    lowScore: {
      suggestion:
        'Include 7-9 high-quality images showing product features and benefits.',
      getMessage: (config) =>
        config.images.thresholds.find((t) => t.score < 7)?.message ||
        'Add more high-quality images.',
    },
    highScore: {
      getMessage: (config) =>
        config.images.thresholds.find((t) => t.score >= 7)?.message ||
        'Image count is good.',
    },
  },
  reviews: {
    lowScore: {
      suggestion:
        'Implement strategies to gather more customer reviews while maintaining quality.',
      getMessage: () => 'Improve review count and/or average rating.',
    },
    highScore: {
      getMessage: () => 'Reviews profile is strong.',
    },
  },
  aPlus: {
    lowScore: {
      suggestion:
        'Add A+ Content to enhance product presentation and conversion rate.',
      getMessage: (config) =>
        config.aPlus.thresholds.find((t) => t.value === 0)?.message ||
        'Consider adding A+ Content.',
    },
    highScore: {
      getMessage: (config) =>
        config.aPlus.thresholds.find((t) => t.value === 1)?.message ||
        'A+ Content present.',
    },
  },
  fulfillment: {
    lowScore: {
      suggestion: 'Consider FBA to improve visibility and customer trust.',
      getMessage: (config) =>
        config.fulfillment.thresholds.find((t) => t.value === 0)?.message ||
        'Consider using FBA.',
    },
    highScore: {
      getMessage: (config) =>
        config.fulfillment.thresholds.find((t) => t.value === 1)?.message ||
        'FBA fulfillment is used.',
    },
  },
};

/**
 * Applies scoring based on predefined thresholds for a given rule.
 * @param value - The numeric value to score.
 * @param rule - The scoring rule containing thresholds.
 * @returns The calculated score.
 */
const applyThresholdScoring = (value: number, rule: ScoringRule): number => {
  const sortedThresholds = [...rule.thresholds].sort(
    (a, b) => b.value - a.value,
  );
  const threshold = sortedThresholds.find((t) => value >= t.value);
  return threshold ? threshold.score : 0;
};

/**
 * Calculates the score for a product description based on its length and HTML formatting.
 * @param description - The product description string.
 * @param config - The scoring configuration.
 * @returns The calculated description score.
 */
const scoreDescription = (
  description: string | null | undefined,
  config: ScoringConfig,
): number => {
  if (!description) return 0;
  const length = description.length;

  const root = parse(description);
  const hasFormattedText =
    root.querySelectorAll(
      'p, br, ul, ol, li, h1, h2, h3, h4, h5, h6, strong, em, b, i',
    ).length > 0;

  const descriptionRule = config.description;
  if (!descriptionRule) return 0;

  const lengthScore = applyThresholdScoring(length, descriptionRule);

  const formattingScore = hasFormattedText ? 2 : 0;
  const maxScore = descriptionRule.thresholds.reduce(
    (max, t) => Math.max(max, t.score),
    0,
  );

  return Math.min(lengthScore + formattingScore, maxScore > 0 ? maxScore : 10);
};

/**
 * Generates suggestions and messages based on product score breakdown.
 * @param scores - The breakdown of scores for different product attributes.
 * @param config - The scoring configuration.
 * @returns An object containing an array of suggestions and a record of messages.
 */
const generateSuggestions = (
  scores: ProductScore['breakdown'],
  config: ScoringConfig,
): { suggestions: string[]; messages: Record<string, string> } => {
  const suggestions: string[] = [];
  const messages: Record<string, string> = {};

  Object.entries(scores).forEach(([key, score]) => {
    const ruleKey = key as keyof ScoringConfig;
    const feedback = scoreFeedbackMap[ruleKey];

    if (!feedback) return;

    if (score < 7) {
      if (feedback.lowScore.suggestion) {
        suggestions.push(feedback.lowScore.suggestion);
      }
      messages[key] = feedback.lowScore.getMessage(config, score);
    } else {
      messages[key] = feedback.highScore.getMessage(config, score);
    }
  });

  return { suggestions, messages };
};

/**
 * Calculates a product's overall quality score and provides a breakdown, suggestions, and messages.
 * @param data - The product listing data.
 * @param config - The scoring configuration (defaults to `defaultScoringConfig`).
 * @returns An object containing the overall score, breakdown, suggestions, and messages.
 */
export const calculateProductQualityScore = (
  data: ProductListingData,
  config: ScoringConfig = defaultScoringConfig,
  performanceMetrics?: {
    conversionRate: number;
    sessions: number;
    reviewRating: number;
    reviewCount: number;
    priceCompetitiveness: number;
    inventoryHealth: number;
  },
): ProductScore => {
  const asin = data.asin || 'N/A';
  console.info('Calculating product quality score', { asin: asin });

  const breakdown = {
    title: applyThresholdScoring(data.title?.length ?? 0, config.title),
    bulletPoints:
      config.bulletPoints.customScoring?.(data.bulletPoints ?? []) ?? 0,
    description: scoreDescription(data.description, config),
    images: applyThresholdScoring(data.imageCount ?? 0, config.images),
    reviews:
      config.reviews.customScoring?.({
        rating: data.rating ?? 0,
        count: data.reviewCount ?? 0,
      }) ?? 0,
    aPlus: applyThresholdScoring(data.hasAPlusContent ? 1 : 0, config.aPlus),
    fulfillment: applyThresholdScoring(
      data.fulfillmentType === 'FBA' ? 1 : 0,
      config.fulfillment,
    ),
  };

  const overall = Object.entries(breakdown).reduce((sum, [key, score]) => {
    const rule = config[key as keyof ScoringConfig];
    const numericScore = typeof score === 'number' ? score : 0;
    return sum + numericScore * (rule?.weight || 0);
  }, 0);

  const { suggestions, messages } = generateSuggestions(
    breakdown as ProductScore['breakdown'],
    config,
  );

  const result: ProductScore = {
    overall: Math.round(overall * 10) / 10,
    breakdown: breakdown as ProductScore['breakdown'],
    suggestions,
    messages,
  };

  console.info('Product quality score calculated successfully', {
    asin: asin,
    score: result.overall,
  });

  return result;
};

/**
 * Calculates an overall product score by combining the quality score and performance score.
 * @param data - The product listing data.
 * @param config - The scoring configuration (defaults to `defaultScoringConfig`).
 * @param performanceMetrics - Optional performance metrics for the product.
 * @param qualityWeight - The weight to apply to the quality score (0-1). Defaults to 0.5.
 * @param performanceWeight - The weight to apply to the performance score (0-1). Defaults to 0.5.
 * @returns The overall product score (0-100).
 */
export const calculateOverallProductScore = (
  data: ProductListingData,
  config: ScoringConfig = defaultScoringConfig,
  performanceMetrics?: {
    conversionRate: number;
    sessions: number;
    reviewRating: number;
    reviewCount: number;
    priceCompetitiveness: number;
    inventoryHealth: number;
  },
  qualityWeight: number = 0.5,
  performanceWeight: number = 0.5,
): number => {
  const qualityScore = calculateProductQualityScore(
    data,
    config,
    performanceMetrics,
  ).overall;
  const performanceScore = performanceMetrics
    ? calculateProductPerformanceScore(performanceMetrics)
    : 0;

  // Ensure weights are within the valid range (0-1) and sum up to 1.
  const normalizedQualityWeight = Math.max(0, Math.min(1, qualityWeight));
  const normalizedPerformanceWeight = Math.max(
    0,
    Math.min(1, performanceWeight),
  );

  if (normalizedQualityWeight + normalizedPerformanceWeight !== 1) {
    console.warn(
      'Quality and performance weights do not sum up to 1. Normalizing.',
    );
  }

  const overallScore =
    qualityScore * normalizedQualityWeight +
    performanceScore * normalizedPerformanceWeight;

  return Number(overallScore.toFixed(2));
};

// Constants for normalization thresholds
const EXCELLENT_CONVERSION_RATE = 20; // Assuming 20% conversion rate is excellent
const EXCELLENT_SESSIONS = 500; // Assuming 500 sessions is excellent
const EXCELLENT_REVIEW_COUNT = 100; // Assuming 100 reviews is excellent

// Weight factors for product score calculation (sum should ideally be 1)
const PRODUCT_SCORE_WEIGHTS = {
  conversion: 0.3,
  sessions: 0.15,
  rating: 0.2,
  reviews: 0.15,
  priceCompetitiveness: 0.1,
  inventoryHealth: 0.1,
};

/**
 * Calculates a comprehensive product score based on various performance and health metrics.
 * This score helps in evaluating a product's overall market standing and potential.
 * NOTE: This function uses a simplified scoring model based on normalization thresholds,
 * distinct from the detailed quality score calculated by `calculateProductQualityScore`.
 * Consider consolidating scoring logic if possible.
 * @param params - Parameters for product score calculation:
 *   - `conversionRate`: The product's conversion rate (e.g., in percentage).
 *   - `sessions`: The number of sessions/visits the product page receives.
 *   - `reviewRating`: The average review rating (e.g., out of 5).
 *   - `reviewCount`: The total number of reviews.
 *   - `priceCompetitiveness`: A metric indicating how competitive the product's price is (e.g., 0-1 scale).
 *   - `inventoryHealth`: A metric indicating the health of the product's inventory (e.g., 0-1 scale).
 * @returns The calculated product score (0-100), rounded to two decimal places.
 */
export const calculateProductPerformanceScore = (
  params: {
    conversionRate: number;
    sessions: number;
    reviewRating: number;
    reviewCount: number;
    priceCompetitiveness: number;
    inventoryHealth: number;
  },
  thresholds?: {
    conversionRate?: number;
    sessions?: number;
    reviewCount?: number;
  },
): number => {
  const {
    conversionRate,
    sessions,
    reviewRating,
    reviewCount,
    priceCompetitiveness,
    inventoryHealth,
  } = params;

  // Use provided thresholds or default values
  const excellentConversionRate =
    thresholds?.conversionRate || EXCELLENT_CONVERSION_RATE;
  const excellentSessions = thresholds?.sessions || EXCELLENT_SESSIONS;
  const excellentReviewCount =
    thresholds?.reviewCount || EXCELLENT_REVIEW_COUNT;

  // Normalize metrics to a 0-1 scale based on predefined "excellent" thresholds.
  // This ensures each metric contributes proportionally to the overall score.
  const normalizedConversion = Math.min(
    conversionRate / excellentConversionRate,
    1,
  );
  const normalizedSessions = Math.min(sessions / excellentSessions, 1);
  const normalizedRating = reviewRating / 5; // Assuming rating is out of 5
  const normalizedReviews = Math.min(reviewCount / excellentReviewCount, 1);

  // Calculate weighted score using predefined weights.
  const score =
    normalizedConversion * PRODUCT_SCORE_WEIGHTS.conversion +
    normalizedSessions * PRODUCT_SCORE_WEIGHTS.sessions +
    normalizedRating * PRODUCT_SCORE_WEIGHTS.rating +
    normalizedReviews * PRODUCT_SCORE_WEIGHTS.reviews +
    priceCompetitiveness * PRODUCT_SCORE_WEIGHTS.priceCompetitiveness +
    inventoryHealth * PRODUCT_SCORE_WEIGHTS.inventoryHealth;

  // Convert the score to a 0-100 scale and round to two decimal places.
  return Number((score * 100).toFixed(2));
};
