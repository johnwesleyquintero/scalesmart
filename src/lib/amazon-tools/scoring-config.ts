// --- Interfaces ---

/**
 * Defines the structure for a single scoring threshold.
 */
export interface ScoringThreshold {
  value: number;
  score: number;
  message?: string;
}

/**
 * Defines the input type for custom scoring logic related to bullet points.
 */
export type BulletPointsScoringInput = string[];

/**
 * Defines the input type for custom scoring logic related to reviews.
 */
export interface ReviewsScoringInput {
  rating: number;
  count: number;
}

/**
 * Defines a single scoring rule for a product attribute.
 */
export interface ScoringRule {
  weight: number;
  thresholds: ScoringThreshold[];
  customScoring?: (
    value: BulletPointsScoringInput | ReviewsScoringInput,
  ) => number;
}

/**
 * Defines the complete scoring configuration for various product attributes.
 */
export interface ScoringConfig {
  title: ScoringRule;
  bulletPoints: ScoringRule;
  description: ScoringRule;
  images: ScoringRule;
  reviews: ScoringRule;
  aPlus: ScoringRule;
  fulfillment: ScoringRule;
}

// --- Constants for Scoring Logic ---

// Title Scoring Constants
const TITLE_MAX_LENGTH = 200;
const TITLE_OPTIMAL_LENGTH = 150;
const TITLE_GOOD_LENGTH = 100;
const TITLE_SHORT_LENGTH = 50;

// Bullet Points Scoring Constants
const BULLET_POINT_MAX_COUNT_FOR_SCORE = 5;
const BULLET_POINT_SCORE_PER_ITEM = 1.5;
const BULLET_POINT_OPTIMAL_LENGTH_MIN = 150;
const BULLET_POINT_OPTIMAL_LENGTH_MAX = 200;
const BULLET_POINT_GOOD_LENGTH = 100;
const BULLET_POINT_OPTIMAL_LENGTH_SCORE = 2.5;
const BULLET_POINT_GOOD_LENGTH_SCORE = 1.5;
const BULLET_POINT_MAX_SCORE = 10;

// Description Scoring Constants
const DESCRIPTION_OPTIMAL_LENGTH = 2000;
const DESCRIPTION_GOOD_LENGTH = 1500;
const DESCRIPTION_DETAILED_LENGTH = 1000;
const DESCRIPTION_EXPANSION_LENGTH = 500;

// Image Scoring Constants
const IMAGES_MAX_COUNT = 9;
const IMAGES_GOOD_COUNT = 7;
const IMAGES_MORE_NEEDED_COUNT = 5;
const IMAGES_NEEDS_MORE_COUNT = 3;

// Reviews Scoring Constants
const REVIEW_RATING_MAX = 5;
const REVIEW_COUNT_TIER_1 = 1000; // Highest tier
const REVIEW_COUNT_TIER_2 = 500;
const REVIEW_COUNT_TIER_3 = 100;
const REVIEW_COUNT_TIER_4 = 50;
const REVIEWS_MAX_SCORE = 10;

// A+ Content Scoring Constants
const APLUS_HAS_CONTENT = 1;

// Fulfillment Scoring Constants
const FBA_FULFILLMENT_VALUE = 1;
const NON_FBA_FULFILLMENT_VALUE = 0;

// --- Type Guards for Custom Scoring Inputs ---

/**
 * Type guard to check if the value is a BulletPointsScoringInput.
 * @param value - The value to check.
 * @returns True if the value is a string array.
 */
function isBulletPointsScoringInput(
  value: unknown,
): value is BulletPointsScoringInput {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

/**
 * Type guard to check if the value is a ReviewsScoringInput.
 * @param value - The value to check.
 * @returns True if the value is an object with 'rating' and 'count' properties.
 */
function isReviewsScoringInput(value: unknown): value is ReviewsScoringInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rating' in value &&
    'count' in value &&
    typeof (value as ReviewsScoringInput).rating === 'number' &&
    typeof (value as ReviewsScoringInput).count === 'number'
  );
}

/**
 * Default scoring configuration for various Amazon product listing attributes.
 * Each attribute has a weight and a set of thresholds or custom scoring logic.
 */
export const defaultScoringConfig: ScoringConfig = {
  title: {
    weight: 0.2,
    thresholds: [
      {
        value: TITLE_MAX_LENGTH,
        score: 5,
        message: `Title exceeds maximum length of ${TITLE_MAX_LENGTH} characters`,
      },
      {
        value: TITLE_OPTIMAL_LENGTH,
        score: 10,
        message: 'Optimal title length',
      },
      {
        value: TITLE_GOOD_LENGTH,
        score: 8,
        message: 'Title could be more descriptive',
      },
      { value: TITLE_SHORT_LENGTH, score: 6, message: 'Title is too short' },
      { value: 0, score: 4, message: 'Title needs significant improvement' },
    ],
  },
  bulletPoints: {
    weight: 0.2,
    thresholds: [], // Custom scoring logic handles thresholds
    customScoring: (value: BulletPointsScoringInput | ReviewsScoringInput) => {
      if (!isBulletPointsScoringInput(value)) {
        console.warn(
          'Invalid input for bulletPoints customScoring. Expected string[].',
        );
        return 0;
      }
      const bullets = value;
      if (!bullets || bullets.length === 0) return 0;

      const count = bullets.length;
      const totalLength = bullets.reduce(
        (sum, bullet) => sum + bullet.length,
        0,
      );
      const avgLength = count > 0 ? totalLength / count : 0;

      let score = 0;
      // Score based on number of bullet points, capped at max count
      score +=
        Math.min(count, BULLET_POINT_MAX_COUNT_FOR_SCORE) *
        BULLET_POINT_SCORE_PER_ITEM;

      // Score based on average length of bullet points
      if (
        avgLength >= BULLET_POINT_OPTIMAL_LENGTH_MIN &&
        avgLength <= BULLET_POINT_OPTIMAL_LENGTH_MAX
      ) {
        score += BULLET_POINT_OPTIMAL_LENGTH_SCORE;
      } else if (avgLength >= BULLET_POINT_GOOD_LENGTH) {
        score += BULLET_POINT_GOOD_LENGTH_SCORE;
      }

      return Math.min(score, BULLET_POINT_MAX_SCORE); // Cap the score at 10
    },
  },
  description: {
    weight: 0.15,
    thresholds: [
      {
        value: DESCRIPTION_OPTIMAL_LENGTH,
        score: 10,
        message: 'Optimal description length with HTML formatting',
      },
      {
        value: DESCRIPTION_GOOD_LENGTH,
        score: 8,
        message: 'Good description length',
      },
      {
        value: DESCRIPTION_DETAILED_LENGTH,
        score: 6,
        message: 'Description could be more detailed',
      },
      {
        value: DESCRIPTION_EXPANSION_LENGTH,
        score: 4,
        message: 'Description needs expansion',
      },
      { value: 0, score: 0, message: 'Missing description' },
    ],
  },
  images: {
    weight: 0.15,
    thresholds: [
      {
        value: IMAGES_MAX_COUNT,
        score: 10,
        message: 'Maximum number of images',
      },
      { value: IMAGES_GOOD_COUNT, score: 8, message: 'Good number of images' },
      {
        value: IMAGES_MORE_NEEDED_COUNT,
        score: 6,
        message: 'Could use more images',
      },
      {
        value: IMAGES_NEEDS_MORE_COUNT,
        score: 4,
        message: 'Needs more images',
      },
      { value: 0, score: 0, message: 'No images' },
    ],
  },
  reviews: {
    weight: 0.15,
    thresholds: [], // Custom scoring logic handles thresholds
    customScoring: (value: BulletPointsScoringInput | ReviewsScoringInput) => {
      if (!isReviewsScoringInput(value)) {
        console.warn(
          'Invalid input for reviews customScoring. Expected { rating: number; count: number }.',
        );
        return 0;
      }
      const { rating, count } = value;
      if (rating === undefined || count === undefined || count < 0) return 0;

      let score = (rating / REVIEW_RATING_MAX) * 5; // Base score on rating (max 5 points)

      // Add points based on review count tiers
      if (count >= REVIEW_COUNT_TIER_1) score += 5;
      else if (count >= REVIEW_COUNT_TIER_2) score += 4;
      else if (count >= REVIEW_COUNT_TIER_3) score += 3;
      else if (count >= REVIEW_COUNT_TIER_4) score += 2;
      else if (count > 0) score += 1; // Give a point for having at least some reviews

      return Math.min(score, REVIEWS_MAX_SCORE); // Cap the score at 10
    },
  },
  aPlus: {
    weight: 0.1,
    thresholds: [
      { value: APLUS_HAS_CONTENT, score: 10, message: 'Has A+ Content' },
      { value: 0, score: 0, message: 'No A+ Content' },
    ],
  },
  fulfillment: {
    weight: 0.05,
    thresholds: [
      { value: FBA_FULFILLMENT_VALUE, score: 10, message: 'FBA fulfillment' },
      {
        value: NON_FBA_FULFILLMENT_VALUE,
        score: 5,
        message: 'Non-FBA fulfillment',
      },
    ],
  },
};

/**
 * Validates if the total weights in the scoring configuration sum up to approximately 1.
 * This is crucial to ensure the overall score calculation is correctly normalized.
 * @param config - The ScoringConfig object to validate.
 * @returns True if the total weight is approximately 1, false otherwise.
 */
export const validateScoringConfig = (config: ScoringConfig): boolean => {
  const totalWeight = Object.values(config).reduce(
    (sum, rule) => sum + rule.weight,
    0,
  );
  // Allow for floating-point imprecision when comparing to 1
  return Math.abs(totalWeight - 1) < 0.0001;
};

/**
 * Retrieves a relevant message for a given score based on the rule's thresholds.
 * @param rule - The ScoringRule containing thresholds.
 * @param value - The actual value being scored.
 * @returns A message string if a matching threshold is found, otherwise undefined.
 */
export const getScoreMessage = (
  rule: ScoringRule,
  value: number,
): string | undefined => {
  if (!rule.thresholds.length) return undefined;

  // Find the first threshold whose value is less than or equal to the given value.
  // Assuming thresholds are sorted in descending order of value.
  const threshold = rule.thresholds.find((t) => value >= t.value);
  return threshold?.message;
};
