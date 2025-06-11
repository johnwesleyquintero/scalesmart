import { NextApiRequest, NextApiResponse } from 'next';
import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { AI_FEATURES } from '@/lib/ai-config';
import { InventoryData } from '@/types/amazon-tools';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { inventoryData } = req.body as { inventoryData: InventoryData[] };

    if (
      !inventoryData ||
      !Array.isArray(inventoryData) ||
      inventoryData.length === 0
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid or empty inventory data provided.' });
    }

    // Construct the prompt for the AI model
    const prompt = generatePrompt({
      category: 'Predictive Inventory Management',
      customCategory: '', // No custom category needed
      context: `Analyze the following Amazon inventory data to predict future demand, identify potential stockouts or overstocking issues, and provide recommendations for optimizing inventory levels. Consider historical sales, current inventory, average daily sales, lead time, and safety stock.

Inventory Data:
${JSON.stringify(inventoryData, null, 2)}`,
      request:
        'Provide a detailed analysis of the inventory data and specific recommendations for each product to optimize inventory levels for the next 30, 60, and 90 days.',
      codeInput: '', // No code input for this task
    });

    // Get AI-driven prediction using the predictive inventory feature config
    const prediction = await getAIDrivenRecommendation(prompt);

    res.status(200).json({ prediction });
  } catch (error) {
    console.error('Error in predictive inventory API:', error);
    res.status(500).json({
      error: `Failed to get predictive inventory analysis: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
