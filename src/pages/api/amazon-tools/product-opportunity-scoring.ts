import { NextApiRequest, NextApiResponse } from 'next';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { ProductResearchData, ParsedFileData } from '@/types/amazon-tools';
import { AI_FEATURES } from '@/lib/ai-config';

// Define the expected request body structure
interface ProductOpportunityScoringRequest {
  productData: ParsedFileData<ProductResearchData>[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productData } = req.body as ProductOpportunityScoringRequest;

  if (!productData || productData.length === 0) {
    return res.status(400).json({ error: 'No product data provided.' });
  }

  try {
    // Construct the prompt for the AI model
    let context =
      'Analyze the following Amazon product research data to identify promising product opportunities. Consider factors like price, reviews, rating, brand, and category to assess potential.\n\n';

    productData.forEach((fileData) => {
      context += `--- Data from ${fileData.fileName} (${fileData.data.length} entries) ---\n`;
      fileData.data.forEach((item, index) => {
        context += `Product ${index + 1}: ${JSON.stringify(item)}\n`;
      });
      context += '\n';
    });

    const request =
      'Based on the provided product data, provide a detailed analysis of potential product opportunities. For each product or group of products, assess its potential based on the data, highlight strengths and weaknesses, and provide a scoring or ranking if possible. Suggest actionable steps to capitalize on identified opportunities or mitigate risks.';

    const prompt = generatePrompt({
      category: 'Feature Implementation', // Or a more specific category if added to promptGenerator
      customCategory: 'AI-Driven Product Opportunity Scoring',
      context: context,
      request: request,
      codeInput: '', // No specific code input needed for this analysis
    });

    // Get AI-driven recommendation using the specific feature configuration
    // Note: The getAIDrivenRecommendation function currently uses the default model config.
    // We might need to modify getAIDrivenRecommendation or create a new function
    // to use feature-specific configurations like AI_FEATURES.productOpportunityScoring.config
    // For now, we'll use the existing function which uses the default config.
    // TODO: Refactor getAIDrivenRecommendation to accept a specific feature config.
    const recommendation = await getAIDrivenRecommendation(prompt);

    res.status(200).json({ analysis: recommendation });
  } catch (error) {
    console.error('Error in product opportunity scoring API:', error);
    res.status(500).json({
      error: `Failed to perform product opportunity scoring: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
