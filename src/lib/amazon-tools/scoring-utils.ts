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
): ProductScore => {
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
