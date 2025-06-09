import { OptimalPriceParams, ProductScoreParams } from '../amazon-types';
import { calculateProductQualityScore } from './scoring-utils';
import { ScoringConfig, defaultScoringConfig } from './scoring-config';

// Constants for normalization thresholds
const EXCELLENT_CONVERSION_RATE = 20; // Assuming 20% conversion rate is excellent
const EXCELLENT_SESSIONS = 500; // Assuming 500 sessions is excellent
const EXCELLENT_REVIEW_COUNT = 100; // Assuming 100 reviews is excellent

// Weight factors for product score calculation (sum should ideally be 1)
const PRODUCT_SCORE_WEIGHTS = {
  conversion: 0.3,
  sessions: 0.15,
  rating: 0.2,
  reviews: 0.15,
  priceCompetitiveness: 0.1,
  inventoryHealth: 0.1,
};

/**
 * Provides algorithms for calculating optimal pricing and product scores for Amazon products.
 */
export class AmazonCalculations {
  /**
   * Calculates Advertising Cost of Sales (ACoS).
   * ACoS is a key metric for Amazon sellers, representing the ratio of ad spend to ad sales.
   * @param adSpend - Total advertising spend. Must be non-negative.
   * @param sales - Total sales revenue. Must be positive.
   * @returns ACoS percentage (0-100), rounded to two decimal places.
   * @throws {Error} If sales are zero or negative, or adSpend is negative.
   */
  static calculateACoS(adSpend: number, sales: number): number {
    if (sales <= 0) {
      throw new Error('Sales must be a positive number to calculate ACoS.');
    }
    if (adSpend < 0) {
      throw new Error('Ad spend cannot be negative.');
    }
    return Number(((adSpend / sales) * 100).toFixed(2));
  }

  /**
   * Calculates a comprehensive product score based on various performance and health metrics.
   * This score helps in evaluating a product's overall market standing and potential.
   * NOTE: This function uses a simplified scoring model based on normalization thresholds,
   * distinct from the detailed quality score calculated by `calculateProductQualityScore`.
   * Consider consolidating scoring logic if possible.
   * @param params - Parameters for product score calculation:
   *   - `conversionRate`: The product's conversion rate (e.g., in percentage).
   *   - `sessions`: The number of sessions/visits the product page receives.
   *   - `reviewRating`: The average review rating (e.g., out of 5).
   *   - `reviewCount`: The total number of reviews.
   *   - `priceCompetitiveness`: A metric indicating how competitive the product's price is (e.g., 0-1 scale).
   *   - `inventoryHealth`: A metric indicating the health of the product's inventory (e.g., 0-1 scale).
   * @returns The calculated product score (0-100), rounded to two decimal places.
   */

  /**
   * Determines an optimal selling price for a product based on competitor pricing and product quality.
   * @param params - Parameters for optimal price calculation:
   *   - `competitorPrices`: An array of prices from competing products.
   *   - `productScore`: The calculated quality score of the product (expected to be 0-100).
   * @returns The calculated optimal price, rounded to two decimal places. Returns 0 if no competitor prices are provided.
   * @throws {Error} If `competitorPrices` is empty, as market data is essential for this calculation.
   */
  static calculateOptimalPrice(params: OptimalPriceParams): number {
    const { competitorPrices, productScore } = params;

    if (competitorPrices.length === 0) {
      throw new Error(
        'Competitor prices array cannot be empty for optimal price calculation. Market data is essential.',
      );
    }

    // Calculate key market metrics from the provided competitor prices.
    // These metrics establish a baseline for competitive pricing.
    const avgCompetitorPrice =
      competitorPrices.reduce((sum, price) => sum + price, 0) /
      competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Define dynamic price bounds to ensure the calculated optimal price
    // remains realistic and competitive within the market.
    // Lower bound: 10% below the minimum competitor price, preventing underpricing.
    const lowerBound = minCompetitorPrice * 0.9;
    // Upper bound: 10% above the maximum competitor price, preventing overpricing.
    const upperBound = maxCompetitorPrice * 1.1;

    let optimalPrice = avgCompetitorPrice; // Start with the average competitor price as a baseline.

    // Adjust the optimal price based on the product's quality score.
    // The product score (0-100) is scaled to a 0-1 range for proportional adjustment.
    const scaledProductScore = productScore / 100;

    // If the product has a high quality score (above 80%), it can command a premium.
    // The price is increased proportionally based on how much the score exceeds 0.8.
    if (scaledProductScore > 0.8) {
      optimalPrice =
        avgCompetitorPrice * (1 + (scaledProductScore - 0.8) * 0.5);
    } else if (scaledProductScore < 0.6) {
      // If the product has a lower quality score (below 60%), it may need more competitive pricing.
      // The price is decreased proportionally based on how much the score is below 0.6.
      optimalPrice =
        avgCompetitorPrice * (1 - (0.6 - scaledProductScore) * 0.5);
    }

    // Ensure the calculated optimal price adheres to the defined market bounds.
    // This prevents the price from being unrealistically low or high.
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    // Return the final optimal price, rounded to two decimal places for currency precision.
    return Number(optimalPrice.toFixed(2));
  }

  /**
   * Calculates a product's overall quality score and provides a breakdown, suggestions, and messages.
   * This function now uses the consolidated logic from `scoring-utils`.
   * @param data - The product listing data.
   * @param config - The scoring configuration (defaults to `defaultScoringConfig`).
   * @returns An object containing the overall score, breakdown, suggestions, and messages.
   */
  static calculateProductQualityScore = calculateProductQualityScore;
}
