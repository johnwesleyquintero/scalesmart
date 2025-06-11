import { CompetitorMonitoringData } from '@/types/amazon-tools';
import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { AI_FEATURES } from '@/lib/ai-config';

/**
 * Analyzes competitor monitoring data using AI to identify opportunities and threats.
 * @param competitorData An array of CompetitorMonitoringData.
 * @returns A promise that resolves to the AI-generated analysis.
 */
export const analyzeCompetitorDataAI = async (
  competitorData: CompetitorMonitoringData[],
): Promise<string> => {
  try {
    // Construct a prompt for the AI
    const prompt = generatePrompt({
      category: 'Competitor Analysis',
      customCategory: '', // No custom category needed
      context: `Analyze the following competitor data to identify potential opportunities and threats. Focus on pricing changes, sales rank fluctuations (BSR), review trends, and stock levels. Provide actionable insights for improving our own product strategy.`,
      request: `Analyze the provided competitor data and generate a summary of key findings, including:
- Significant price changes (increases or decreases) and their potential impact.
- Trends in Best Seller Rank (BSR) and what they might indicate about competitor sales performance.
- Changes in review counts and ratings, and their implications for customer sentiment.
- Stock level changes and potential supply chain issues for competitors.
- Actionable recommendations for our product strategy based on this analysis.

Competitor Data (JSON format):
${JSON.stringify(competitorData, null, 2)}`,
      codeInput: '', // No code input for this analysis
    });

    // Get AI-driven recommendation using the generated prompt and specific feature config
    const analysis = await getAIDrivenRecommendation(prompt);

    return analysis;
  } catch (error) {
    console.error('Error analyzing competitor data with AI:', error);
    throw new Error(
      `Failed to get AI-driven competitor analysis: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
