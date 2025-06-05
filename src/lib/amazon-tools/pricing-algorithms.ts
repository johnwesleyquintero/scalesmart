import { OptimalPriceParams, ProductScoreParams } from '../amazon-types';

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
export class PricingAlgorithms {
  /**
   * Calculates the optimal selling price for a product based on competitor pricing and its product score.
   * This algorithm aims to find a competitive price point that also reflects the product's quality.
   * @param params - Parameters for optimal price calculation:
   *   - `competitorPrices`: An array of prices from competing products.
   *   - `productScore`: The calculated quality score of the product (expected to be 0-100).
   * @returns The calculated optimal price, rounded to two decimal places.
   * @throws {Error} If `competitorPrices` is empty, as market data is essential for this calculation.
   */
  static calculateOptimalPrice(params: OptimalPriceParams): number {
    const { competitorPrices, productScore } = params;

    if (competitorPrices.length === 0) {
      throw new Error(
        'Competitor prices array cannot be empty for optimal price calculation.',
      );
    }

    // Calculate market metrics from competitor prices
    const avgCompetitorPrice =
      competitorPrices.reduce((sum, price) => sum + price, 0) /
      competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Define price bounds to ensure the optimal price remains realistic and competitive
    const lowerBound = minCompetitorPrice * 0.9; // 10% below minimum competitor price
    const upperBound = maxCompetitorPrice * 1.1; // 10% above maximum competitor price

    let optimalPrice = avgCompetitorPrice;

    // Adjust price based on product score.
    // The product score is scaled to a 0-1 range for proportional adjustment.
    const scaledProductScore = productScore / 100; // Assuming productScore is 0-100

    if (scaledProductScore > 0.8) {
      // High-quality products can command a premium price
      optimalPrice =
        avgCompetitorPrice * (1 + (scaledProductScore - 0.8) * 0.5);
    } else if (scaledProductScore < 0.6) {
      // Lower-quality products may need more competitive pricing
      optimalPrice =
        avgCompetitorPrice * (1 - (0.6 - scaledProductScore) * 0.5);
    }

    // Ensure the calculated optimal price stays within the defined bounds
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    return Number(optimalPrice.toFixed(2));
  }

  /**
   * Calculates a comprehensive product score based on various performance and health metrics.
   * This score helps in evaluating a product's overall market standing and potential.
   * @param params - Parameters for product score calculation:
   *   - `conversionRate`: The product's conversion rate (e.g., in percentage).
   *   - `sessions`: The number of sessions/visits the product page receives.
   *   - `reviewRating`: The average review rating (e.g., out of 5).
   *   - `reviewCount`: The total number of reviews.
   *   - `priceCompetitiveness`: A metric indicating how competitive the product's price is (e.g., 0-1 scale).
   *   - `inventoryHealth`: A metric indicating the health of the product's inventory (e.g., 0-1 scale).
   * @returns The calculated product score (0-100), rounded to two decimal places.
   */
  static calculateProductScore(params: ProductScoreParams): number {
    const {
      conversionRate,
      sessions,
      reviewRating,
      reviewCount,
      priceCompetitiveness,
      inventoryHealth,
    } = params;

    // Normalize metrics to a 0-1 scale based on predefined "excellent" thresholds.
    // This ensures each metric contributes proportionally to the overall score.
    const normalizedConversion = Math.min(
      conversionRate / EXCELLENT_CONVERSION_RATE,
      1,
    );
    const normalizedSessions = Math.min(sessions / EXCELLENT_SESSIONS, 1);
    const normalizedRating = reviewRating / 5; // Assuming rating is out of 5
    const normalizedReviews = Math.min(reviewCount / EXCELLENT_REVIEW_COUNT, 1);

    // Calculate weighted score using predefined weights.
    const score =
      normalizedConversion * PRODUCT_SCORE_WEIGHTS.conversion +
      normalizedSessions * PRODUCT_SCORE_WEIGHTS.sessions +
      normalizedRating * PRODUCT_SCORE_WEIGHTS.rating +
      normalizedReviews * PRODUCT_SCORE_WEIGHTS.reviews +
      priceCompetitiveness * PRODUCT_SCORE_WEIGHTS.priceCompetitiveness +
      inventoryHealth * PRODUCT_SCORE_WEIGHTS.inventoryHealth;

    // Convert the score to a 0-100 scale and round to two decimal places.
    return Number((score * 100).toFixed(2));
  }
}
