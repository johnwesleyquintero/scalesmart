import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service Configuration
 * Centralizes AI service initialization and configuration management
 */

// Initialize Gemini AI client
export const initGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined in the environment');
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return new GoogleGenerativeAI(apiKey);
};

// AI model configurations
export const AI_MODELS = {
  gemini: {
    default: 'gemini-2.0-flash-001',
    config: {
      maxOutputTokens: 1000,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  },
} as const;

// AI feature configurations for different tools
export const AI_FEATURES = {
  keywordAnalyzer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.5, // More focused for keyword analysis
    },
  },
  listingOptimizer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.6, // Balanced creativity for listings
    },
  },
  ppcCampaign: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.3, // More conservative for PPC suggestions
    },
  },
  seoAnalyzer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.4, // Balanced for SEO analysis
      maxOutputTokens: 1500, // Allow more detailed SEO reports
    },
  },
};
