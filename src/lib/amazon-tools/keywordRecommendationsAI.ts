import { KeywordTrackingData } from '@/types/amazon-tools';
import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { AI_FEATURES } from '@/lib/ai-config';

/**
 * Generates AI-driven keyword recommendations based on provided keyword tracking data.
 * @param keywordData - An array of KeywordTrackingData to analyze.
 * @returns A promise resolving to a string containing the AI's recommendations.
 */
export async function generateKeywordRecommendations(
  keywordData: KeywordTrackingData[],
): Promise<string> {
  // Define the task category for the prompt
  const taskCategory = 'Keyword Recommendations';

  // Construct the context for the AI, including the provided keyword data
  const context = `Analyze the following Amazon keyword tracking data. Each entry includes keyword, rank, search volume, competition, and CPC.
  
Data:
${JSON.stringify(keywordData, null, 2)}
`;

  // Define the specific request for the AI
  const request = `Based on the provided keyword tracking data, suggest relevant and high-converting keywords. Consider search volume, competition, and current rankings. Provide the recommendations in a clear, easy-to-read format.`;

  // Generate the structured prompt using the prompt generator utility
  const prompt = generatePrompt({
    category: taskCategory,
    customCategory: '', // Use standard category
    context: context,
    request: request,
    codeInput: '', // No specific code input needed for this task
  });

  try {
    // Get the AI-driven recommendation using the Gemini API utility
    // Use the keywordAnalyzer feature configuration
    const recommendation = await getAIDrivenRecommendation(prompt);

    // TODO: Implement parsing of the AI's response if a structured output format is defined.
    // For now, return the raw text response.

    return recommendation;
  } catch (error) {
    console.error('Error generating keyword recommendations:', error);
    throw new Error(
      `Failed to generate keyword recommendations: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Note: Further refinement might involve defining a specific output format for the AI
// and parsing the response into a structured object or array of recommended keywords.
// This would require updating the prompt request and adding a parsing function here.
