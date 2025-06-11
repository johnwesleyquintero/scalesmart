import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { AI_FEATURES } from '@/lib/ai-config';

// This file contains the AI logic for analyzing customer reviews.
// It uses the AI configuration and prompt generator to perform sentiment analysis and identify themes.

/**
 * Analyzes a single customer review using AI to determine sentiment and identify key themes.
 * @param reviewText The text of the customer review.
 * @returns A promise that resolves to an object containing sentiment and themes, or null if analysis fails.
 */
export async function analyzeReviewWithAI(reviewText: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  themes: string[];
} | null> {
  if (!reviewText || reviewText.trim() === '') {
    console.warn('analyzeReviewWithAI called with empty review text.');
    return null;
  }

  try {
    // Define the prompt data for the AI
    const promptData = {
      category: 'Review Analysis',
      customCategory: '', // No custom category needed
      context: `Analyze the following customer review to determine its overall sentiment (positive, negative, or neutral) and identify the key themes or topics discussed. Provide the output in a JSON format with 'sentiment' (string) and 'themes' (array of strings) fields.`,
      request: `Analyze this review:\n\n"${reviewText}"`,
      codeInput: '', // No code input for this task
    };

    // Generate the structured prompt
    const prompt = generatePrompt(promptData);

    // Get the AI-driven recommendation (analysis)
    const aiResponse = await getAIDrivenRecommendation(prompt);

    // Attempt to parse the JSON response
    const parsedResponse = JSON.parse(aiResponse);

    // Validate the parsed response structure
    if (
      typeof parsedResponse.sentiment !== 'string' ||
      !['positive', 'negative', 'neutral'].includes(parsedResponse.sentiment) ||
      !Array.isArray(parsedResponse.themes) ||
      !parsedResponse.themes.every((theme: string) => typeof theme === 'string')
    ) {
      console.error(
        'AI response did not match expected JSON structure:',
        aiResponse,
      );
      return null;
    }

    // Return the parsed sentiment and themes
    return {
      sentiment: parsedResponse.sentiment as
        | 'positive'
        | 'negative'
        | 'neutral',
      themes: parsedResponse.themes,
    };
  } catch (error) {
    console.error('Error analyzing review with AI:', error);
    return null;
  }
}
