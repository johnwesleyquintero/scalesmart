import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { ListingOptimizationData } from '@/types/amazon-tools';

/**
 * Generates an AI-driven suggestion for improving a product title.
 * @param listingData The ListingOptimizationData object for the product.
 * @returns A promise that resolves to the AI's suggestion for the title.
 */
export async function suggestOptimizedTitle(
  listingData: ListingOptimizationData,
): Promise<string> {
  const prompt = `Analyze the following product title and suggest an improved version for Amazon. Focus on clarity, keywords, and compelling language to attract customers.

Current Title: "${listingData.title}"

Consider incorporating relevant keywords if available (e.g., from keyword tracking data, though not provided here).

Suggested Optimized Title:`;

  try {
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
  const prompt = `Analyze the following product bullet points and suggest improved versions for Amazon. Ensure they highlight key features and benefits, are concise, and use strong action verbs.

Current Bullet Points:
${listingData.bulletPoints.map((bp) => `- ${bp}`).join('\n')}

Suggested Optimized Bullet Points (as a numbered or bulleted list):`;

  try {
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
  const prompt = `Analyze the following product description and suggest an improved version for Amazon. Focus on storytelling, highlighting benefits, and providing detailed information to inform and persuade customers.

Current Description:
"${listingData.description}"

Suggested Optimized Description:`;

  try {
    const recommendation = await getAIDrivenRecommendation(prompt);
    return recommendation.trim();
  } catch (error) {
    console.error('Error getting AI suggestion for description:', error);
    throw new Error('Failed to get AI suggestion for description.');
  }
}

// You can add more functions here for other optimization tasks,
// e.g., suggesting backend keywords, analyzing subject matter, etc.
