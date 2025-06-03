import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Initializes the Google Generative AI client.
 * Retrieves the API key from environment variables and throws an error if it's not found.
 * @returns An instance of GoogleGenerativeAI.
 * @throws {Error} If GEMINI_API_KEY is not defined.
 */
export const initGeminiAI = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Log the error for debugging purposes
    console.error(
      'Configuration Error: GEMINI_API_KEY is not defined in environment variables.',
    );
    throw new Error(
      'Missing GEMINI_API_KEY environment variable. Please configure your environment.',
    );
  }
  // Return a new instance of the AI client
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Centralized AI model configurations.
 * Defines default settings for different AI models.
 */
export const AI_MODELS = {
  gemini: {
    default: 'gemini-1.5-flash-latest', // Using a potentially more up-to-date model identifier if available and suitable
    config: {
      maxOutputTokens: 1000,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  },
  // Add configurations for other models here if needed
} as const;

/**
 * AI feature-specific configurations.
 * Overrides or extends default model configurations for specific use cases.
 */
export const AI_FEATURES = {
  keywordAnalyzer: {
    model: AI_MODELS.gemini.default, // Explicitly referencing the default model
    config: {
      ...AI_MODELS.gemini.config, // Start with default settings
      temperature: 0.5, // More focused for keyword analysis (override)
      maxOutputTokens: 800, // Potentially smaller output needed
    },
  },
  listingOptimizer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.6, // Balanced creativity for listings (override)
      maxOutputTokens: 1200, // Potentially larger output needed
    },
  },
  ppcCampaign: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.3, // More conservative for PPC suggestions (override)
      topP: 0.7, // Tighter sampling
    },
  },
  seoAnalyzer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.4, // Balanced for SEO analysis (override)
      maxOutputTokens: 1500, // Allow more detailed SEO reports (override)
    },
  },
  // Add configurations for other features here
} as const;

// Example of how these configurations might be used (not part of the refactored export)
/*
import { initGeminiAI, AI_FEATURES } from './this-file';

async function analyzeKeywords(prompt: string) {
  try {
    const genAI = initGeminiAI(); // Initialize the client
    const featureConfig = AI_FEATURES.keywordAnalyzer;
    const model = genAI.getGenerativeModel({
      model: featureConfig.model,
      generationConfig: featureConfig.config,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log(response.text());
  } catch (error) {
    console.error('Error during keyword analysis:', error);
    // Handle the error appropriately
  }
}
*/
