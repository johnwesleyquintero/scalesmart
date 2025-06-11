import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { ListingOptimizationData } from '@/types/amazon-tools';
import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { PromptData } from '@/lib/prompt-generator/types';

/**
 * Generates an AI-driven suggestion for improving a product title.
 * @param listingData The ListingOptimizationData object for the product.
 * @returns A promise that resolves to the AI's suggestion for the title.
 */
export async function suggestOptimizedTitle(
  listingData: ListingOptimizationData,
): Promise<string> {
  const promptData: PromptData = {
    category: 'Optimization',
    customCategory: '',
    context: `Current Product Title: "${listingData.title}"`,
    request: `Analyze the provided product title and suggest an improved version for Amazon. Focus on clarity, incorporating relevant keywords (if available, though not provided here), and using compelling language to attract customers and improve search ranking. Provide only the suggested optimized title in your response.`,
    codeInput: '', // No code input needed for this task
  };

  try {
    const prompt = generatePrompt(promptData);
    const recommendation = await getAIDrivenRecommendation(prompt);
    return recommendation.trim();
  } catch (error) {
    console.error('Error getting AI suggestion for title:', error);
    throw new Error('Failed to get AI suggestion for title.');
  }
}

/**
 * Generates an AI-driven suggestion for improving product bullet points.
 * @param listingData The ListingOptimizationData object for the product.
 * @returns A promise that resolves to the AI's suggestion for the bullet points.
 */
export async function suggestOptimizedBulletPoints(
  listingData: ListingOptimizationData,
): Promise<string> {
  const promptData: PromptData = {
    category: 'Optimization',
    customCategory: '',
    context: `Current Product Bullet Points:\n${listingData.bulletPoints.map((bp) => `- ${bp}`).join('\n')}`,
    request: `Analyze the provided product bullet points and suggest improved versions for Amazon. Ensure they highlight key features and benefits, are concise, use strong action verbs, and are formatted as a numbered or bulleted list. Provide only the suggested optimized bullet points in your response.`,
    codeInput: '', // No code input needed for this task
  };

  try {
    const prompt = generatePrompt(promptData);
    const recommendation = await getAIDrivenRecommendation(prompt);
    return recommendation.trim();
  } catch (error) {
    console.error('Error getting AI suggestion for bullet points:', error);
    throw new Error('Failed to get AI suggestion for bullet points.');
  }
}

/**
 * Generates an AI-driven suggestion for improving a product description.
 * @param listingData The ListingOptimizationData object for the product.
 * @returns A promise that resolves to the AI's suggestion for the description.
 */
export async function suggestOptimizedDescription(
  listingData: ListingOptimizationData,
): Promise<string> {
  const promptData: PromptData = {
    category: 'Optimization',
    customCategory: '',
    context: `Current Product Description:\n"${listingData.description}"`,
    request: `Analyze the provided product description and suggest an improved version for Amazon. Focus on storytelling, highlighting benefits, and providing detailed information to inform and persuade customers. Ensure the description is well-structured and easy to read. Provide only the suggested optimized description in your response.`,
    codeInput: '', // No code input needed for this task
  };

  try {
    const prompt = generatePrompt(promptData);
    const recommendation = await getAIDrivenRecommendation(prompt);
    return recommendation.trim();
  } catch (error) {
    console.error('Error getting AI suggestion for description:', error);
    throw new Error('Failed to get AI suggestion for description.');
  }
}

// You can add more functions here for other optimization tasks,
// e.g., suggesting backend keywords, analyzing subject matter, etc.
