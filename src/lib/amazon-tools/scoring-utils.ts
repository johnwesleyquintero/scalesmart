import { parse } from 'node-html-parser';
// Assuming ProductListingData is defined in amazon-types and includes these fields
// If not, you'll need to define it or adjust the type usage.
import { type ProductListingData } from '../amazon-types';
import { logger } from '../logger';
import {
  defaultScoringConfig,
  type ScoringConfig,
  type ScoringRule,
} from './scoring-config';
// Placeholder for validation - replace with actual validation logic if available
const validateProductListing = (data: ProductListingData) => ({
  success: true,
  data: data,
  error: null,
});

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
  messages: Record<string, string>; // Add messages property to the interface
}

// Define a simple error structure if createCalculationError is unavailable
class CalculationError extends Error {
  context?: Record<string, unknown>;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'CalculationError';
    this.context = context;
  }
}

const applyThresholdScoring = (value: number, rule: ScoringRule): number => {
  // Check if customScoring exists and the value is appropriate for it
  // The original code passed 'value' directly, which might not be what customScoring expects
  // Adjust this logic based on what customScoring functions actually need
  if (rule.customScoring) {
    // Example: If custom scoring expects an object for reviews, handle it here or ensure correct data is passed initially
    // For now, assuming customScoring can handle the 'value' type or is handled elsewhere
    // return rule.customScoring(value); // This was likely incorrect for complex types like reviews/bullets
    // Let's rely on the specific calls below to handle customScoring correctly
  }

  // Ensure thresholds are sorted descending by value for correct matching
  const sortedThresholds = [...rule.thresholds].sort(
    (a, b) => b.value - a.value,
  );
  const threshold = sortedThresholds.find((t) => value >= t.value);
  return threshold ? threshold.score : 0;
};

const scoreDescription = (description: string | null | undefined): number => {
  if (!description) return 0;
  const length = description.length;

  // Use HTML parser for more accurate tag detection
  const root = parse(description);
  const hasFormattedText =
    root.querySelectorAll(
      'p, br, ul, ol, li, h1, h2, h3, h4, h5, h6, strong, em, b, i',
    ).length > 0;

  // Find the description rule from the config
  const descriptionRule = defaultScoringConfig.description;
  if (!descriptionRule) return 0; // Should not happen with default config

  // Apply threshold scoring based on length
  const lengthScore = applyThresholdScoring(length, descriptionRule);

  // Add bonus for formatting, ensuring total doesn't exceed max score (e.g., 10)
  const formattingScore = hasFormattedText ? 2 : 0; // Example bonus
  const maxScore = descriptionRule.thresholds.reduce(
    (max, t) => Math.max(max, t.score),
    0,
  );

  // Ensure the combined score doesn't exceed the maximum possible score defined by thresholds (or a fixed cap like 10)
  return Math.min(lengthScore + formattingScore, maxScore > 0 ? maxScore : 10);
};

// Correct the return type annotation
const generateSuggestions = (
  scores: ProductScore['breakdown'],
  config: ScoringConfig,
): { suggestions: string[]; messages: Record<string, string> } => {
  const suggestions: string[] = [];
  const messages: Record<string, string> = {};

  Object.entries(scores).forEach(([key, score]) => {
    const ruleKey = key as keyof ScoringConfig;
    const rule = config[ruleKey];
    if (!rule) return; // Skip if the key doesn't match a config rule

    // Handle getting message based on score (0-10) or raw value if needed
    if (rule.thresholds?.length > 0) {
      // Find the threshold corresponding to the *achieved score* to get the message
      // This requires finding which threshold *produced* the score, which is complex.
      // A simpler approach is to get a message based on the score level itself,
      // or re-evaluate the original value against thresholds just for the message.
      // Let's try getting message based on score level (e.g., < 7 is bad)
      // Or use the getScoreMessage helper if it's designed for this (it seems based on value, not score)
      // Let's stick to the simple suggestion logic below for now.
      // If getScoreMessage was intended to map score back to message, its logic needs review.
      // const message = getScoreMessage(rule, value); // Need the original value here, not the score
    }

    // Simplified suggestion logic based on score thresholds
    if (score < 7) {
      switch (key) {
        case 'title':
          suggestions.push(
            'Optimize title length (150-200 characters) with relevant keywords.',
          );
          messages[key] =
            config.title.thresholds.find((t) => t.score < 7)?.message ||
            'Title needs improvement.';
          break;
        case 'bulletPoints':
          suggestions.push(
            'Add 5 bullet points, each 150-200 characters, highlighting key features.',
          );
          messages[key] = 'Improve bullet points quantity and/or length.';
          break;
        case 'description':
          suggestions.push(
            'Expand description to 2000+ characters with proper HTML formatting.',
          );
          messages[key] =
            config.description.thresholds.find((t) => t.score < 7)?.message ||
            'Description needs improvement.';
          break;
        case 'images':
          suggestions.push(
            'Include 7-9 high-quality images showing product features and benefits.',
          );
          messages[key] =
            config.images.thresholds.find((t) => t.score < 7)?.message ||
            'Add more high-quality images.';
          break;
        case 'reviews':
          suggestions.push(
            'Implement strategies to gather more customer reviews while maintaining quality.',
          );
          messages[key] = 'Improve review count and/or average rating.';
          break;
        case 'aPlus':
          suggestions.push(
            'Add A+ Content to enhance product presentation and conversion rate.',
          );
          messages[key] =
            config.aPlus.thresholds.find((t) => t.value === 0)?.message ||
            'Consider adding A+ Content.';
          break;
        case 'fulfillment':
          suggestions.push(
            'Consider FBA to improve visibility and customer trust.',
          );
          messages[key] =
            config.fulfillment.thresholds.find((t) => t.value === 0)?.message ||
            'Consider using FBA.';
          break;
      }
    } else {
      // Optionally add positive messages for scores >= 7
      switch (key) {
        case 'title':
          messages[key] =
            config.title.thresholds.find((t) => t.score >= 7)?.message ||
            'Title is good.';
          break;
        case 'description':
          messages[key] =
            config.description.thresholds.find((t) => t.score >= 7)?.message ||
            'Description is good.';
          break;
        case 'images':
          messages[key] =
            config.images.thresholds.find((t) => t.score >= 7)?.message ||
            'Image count is good.';
          break;
        case 'aPlus':
          messages[key] =
            config.aPlus.thresholds.find((t) => t.value === 1)?.message ||
            'A+ Content present.';
          break;
        case 'fulfillment':
          messages[key] =
            config.fulfillment.thresholds.find((t) => t.value === 1)?.message ||
            'FBA fulfillment is used.';
          break;
        // Add messages for bulletPoints and reviews if desired
        case 'bulletPoints':
          messages[key] = 'Bullet points are well-structured.';
          break;
        case 'reviews':
          messages[key] = 'Reviews profile is strong.';
          break;
      }
    }
  });

  // Return the object with both suggestions and messages
  return { suggestions, messages };
};

export const calculateProductScore = (
  data: ProductListingData,
  config: ScoringConfig = defaultScoringConfig,
): ProductScore => {
  try {
    // Assuming validateProductListing exists and works as intended
    const validationResult = validateProductListing(data);
    if (!validationResult.success) {
      // Use the custom CalculationError or a standard Error
      throw new CalculationError('Invalid product data', {
        // errors: validationResult.error.errors, // Adjust if error structure differs
        errors: validationResult.error,
      });
    }

    // Assuming data has an 'asin' property, adjust if needed based on ProductListingData definition
    const asin = data.asin || 'N/A'; // Use N/A if asin is not present
    logger.info('Calculating product score', { asin: asin });

    // Ensure customScoring functions are called with the correct data structure
    const breakdown = {
      title: applyThresholdScoring(data.title?.length || 0, config.title),
      bulletPoints:
        config.bulletPoints.customScoring?.(data.bulletPoints || []) || 0, // Pass array or empty array
      description: scoreDescription(data.description), // Use the updated scoreDescription
      images: applyThresholdScoring(data.imageCount || 0, config.images),
      reviews:
        config.reviews.customScoring?.({
          rating: data.rating || 0, // Provide default value
          count: data.reviewCount || 0, // Provide default value
        }) || 0,
      aPlus: applyThresholdScoring(data.hasAPlusContent ? 1 : 0, config.aPlus),
      fulfillment: applyThresholdScoring(
        data.fulfillmentType === 'FBA' ? 1 : 0,
        config.fulfillment,
      ),
    };

    const overall = Object.entries(breakdown).reduce((sum, [key, score]) => {
      const rule = config[key as keyof ScoringConfig];
      // Ensure score is a number before calculation
      const numericScore = typeof score === 'number' ? score : 0;
      return sum + numericScore * (rule?.weight || 0);
    }, 0);

    // Destructure correctly based on the updated return type of generateSuggestions
    const { suggestions, messages } = generateSuggestions(breakdown, config);

    const result: ProductScore = {
      overall: Math.round(overall * 10) / 10, // Keep rounding
      breakdown,
      suggestions, // Assign the destructured suggestions
      messages, // Assign the destructured messages
    };

    logger.info('Product score calculated successfully', {
      asin: asin,
      score: result.overall,
    });

    return result;
  } catch (error) {
    // Refactor logError call to use a single object argument
    // Throw a standard error or the custom one
    throw new CalculationError(
      `Failed to calculate product score: ${(error as Error).message}`,
    );
  }
};

// Ensure that the ProductListingData type includes the 'asin' property or adjust the code to reflect the actual structure of ProductListingData.
// Resolve the type mismatch error by ensuring that the argument passed to the function expecting a Record<string, unknown> is correctly formatted and not void.
