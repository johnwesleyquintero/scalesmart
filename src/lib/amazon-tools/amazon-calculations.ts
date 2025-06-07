import {
  OptimalPriceParams,
  ProductListingData,
  ProductScoreParams,
} from '../amazon-types';
import {
  defaultScoringConfig,
  ScoringConfig,
  ScoringRule,
} from './scoring-config';
import { parse } from 'node-html-parser';

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
 * Type guard to check if the value is a string array (BulletPointsScoringInput).
 * @param value - The value to check.
 * @returns True if the value is a string array.
 */
function isBulletPointsScoringInput(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

/**
 * Type guard to check if the value is a ReviewsScoringInput.
 * @param value - The value to check.
 * @returns True if the value is an object with 'rating' and 'count' properties.
 */
function isReviewsScoringInput(
  value: unknown,
): value is { rating: number; count: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rating' in value &&
    'count' in value &&
    typeof (value as { rating: number; count: number }).rating === 'number' &&
    typeof (value as { rating: number; count: number }).count === 'number'
  );
}

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
 * Generates suggestions and messages based on product score breakdown.
 * @param scores - The breakdown of scores for different product attributes.
 * @param config - The scoring configuration.
 * @returns An object containing an array of suggestions and a record of messages.
 */
const generateSuggestions = (
  scores: { [key: string]: number },
  config: ScoringConfig,
): { suggestions: string[]; messages: Record<string, string> } => {
  const suggestions: string[] = [];
  const messages: Record<string, string> = {};

  Object.entries(scores).forEach(([key, score]) => {
    const ruleKey = key as keyof ScoringConfig;
    const feedback = scoreFeedbackMap[ruleKey];

    if (!feedback) return; // Should not happen if scoreFeedbackMap is comprehensive

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
 * Provides algorithms for calculating optimal pricing and product scores for Amazon products.
 */
export class AmazonCalculations {
  /**
   * Calculates Advertising Cost of Sales (ACoS).
   * ACoS is a key metric for Amazon sellers, representing the ratio of ad spend to ad sales.
   * @param adSpend - Total advertising spend. Must be non-negative.
   * @param sales - Total sales revenue. Must be positive.
   * @returns ACoS percentage (0-100), rounded to two decimal places.
   * @throws {Error} If sales are zero or negative, or adSpend is negative.
   */
  static calculateACoS(adSpend: number, sales: number): number {
    if (sales <= 0) {
      throw new Error('Sales must be a positive number to calculate ACoS.');
    }
    if (adSpend < 0) {
      throw new Error('Ad spend cannot be negative.');
    }
    return Number(((adSpend / sales) * 100).toFixed(2));
  }

  /**
   * Calculates a comprehensive product score based on various performance and health metrics.
   * This score helps in evaluating a product's overall market standing and potential.
   * @param params - Parameters for product score calculation:
   *   - `conversionRate`: The product's conversion rate (e.g., in percentage).
   *   - `sessions`: The number of sessions/visits the product page receives.
   *   - `reviewRating`: The average review rating (e.g., out of 5).
   *   - `reviewCount`: The total number of reviews.
   *   - `priceCompetitiveness`: A metric indicating how competitive the product's price is (e.g., 0-1 scale).
   *   - `inventoryHealth`: A metric indicating the health of the product's inventory (e.g., 0-1 scale).
   * @returns The calculated product score (0-100), rounded to two decimal places.
   */
  static calculateProductScore(params: ProductScoreParams): number {
    const {
      conversionRate,
      sessions,
      reviewRating,
      reviewCount,
      priceCompetitiveness,
      inventoryHealth,
    } = params;

    // Normalize metrics to a 0-1 scale based on predefined "excellent" thresholds.
    // This ensures each metric contributes proportionally to the overall score.
    const normalizedConversion = Math.min(
      conversionRate / EXCELLENT_CONVERSION_RATE,
      1,
    );
    const normalizedSessions = Math.min(sessions / EXCELLENT_SESSIONS, 1);
    const normalizedRating = reviewRating / 5; // Assuming rating is out of 5
    const normalizedReviews = Math.min(reviewCount / EXCELLENT_REVIEW_COUNT, 1);

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
  }

  /**
   * Determines an optimal selling price for a product based on competitor pricing and product quality.
   * @param params - Parameters for optimal price calculation:
   *   - `competitorPrices`: An array of prices from competing products.
   *   - `productScore`: The calculated quality score of the product (expected to be 0-100).
   * @returns The calculated optimal price, rounded to two decimal places. Returns 0 if no competitor prices are provided.
   * @throws {Error} If `competitorPrices` is empty, as market data is essential for this calculation.
   */
  static calculateOptimalPrice(params: OptimalPriceParams): number {
    const { competitorPrices, productScore } = params;

    if (competitorPrices.length === 0) {
      throw new Error(
        'Competitor prices array cannot be empty for optimal price calculation. Market data is essential.',
      );
    }

    // Calculate key market metrics from the provided competitor prices.
    // These metrics establish a baseline for competitive pricing.
    const avgCompetitorPrice =
      competitorPrices.reduce((sum, price) => sum + price, 0) /
      competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Define dynamic price bounds to ensure the calculated optimal price
    // remains realistic and competitive within the market.
    // Lower bound: 10% below the minimum competitor price, preventing underpricing.
    const lowerBound = minCompetitorPrice * 0.9;
    // Upper bound: 10% above the maximum competitor price, preventing overpricing.
    const upperBound = maxCompetitorPrice * 1.1;

    let optimalPrice = avgCompetitorPrice; // Start with the average competitor price as a baseline.

    // Adjust the optimal price based on the product's quality score.
    // The product score (0-100) is scaled to a 0-1 range for proportional adjustment.
    const scaledProductScore = productScore / 100;

    // If the product has a high quality score (above 80%), it can command a premium.
    // The price is increased proportionally based on how much the score exceeds 0.8.
    if (scaledProductScore > 0.8) {
      optimalPrice =
        avgCompetitorPrice * (1 + (scaledProductScore - 0.8) * 0.5);
    } else if (scaledProductScore < 0.6) {
      // If the product has a lower quality score (below 60%), it may need more competitive pricing.
      // The price is decreased proportionally based on how much the score is below 0.6.
      optimalPrice =
        avgCompetitorPrice * (1 - (0.6 - scaledProductScore) * 0.5);
    }

    // Ensure the calculated optimal price adheres to the defined market bounds.
    // This prevents the price from being unrealistically low or high.
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    // Return the final optimal price, rounded to two decimal places for currency precision.
    return Number(optimalPrice.toFixed(2));
  }

  /**
   * Calculates a product's overall quality score and provides a breakdown, suggestions, and messages.
   * @param data - The product listing data.
   * @param config - The scoring configuration (defaults to `defaultScoringConfig`).
   * @returns An object containing the overall score, breakdown, suggestions, and messages.
   */
  static calculateProductQualityScore(
    data: ProductListingData,
    config: ScoringConfig = defaultScoringConfig,
  ): {
    overall: number;
    breakdown: { [key: string]: number };
    suggestions: string[];
    messages: Record<string, string>;
  } {
    const asin = data.asin || 'N/A';
    console.info('Calculating product quality score', { asin: asin });

    const breakdown = {
      title: applyThresholdScoring(data.title?.length || 0, config.title),
      bulletPoints:
        config.bulletPoints.customScoring?.(data.bulletPoints || []) || 0,
      description: scoreDescription(data.description, config),
      images: applyThresholdScoring(data.imageCount || 0, config.images),
      reviews:
        config.reviews.customScoring?.({
          rating: data.rating || 0,
          count: data.reviewCount || 0,
        }) || 0,
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

    const { suggestions, messages } = generateSuggestions(breakdown, config);

    return {
      overall: Math.round(overall * 10) / 10,
      breakdown,
      suggestions,
      messages,
    };
  }
}
