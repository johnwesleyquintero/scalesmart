import type { OptimalPriceParams } from '../amazon-types';
export class AmazonAlgorithms {
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
   * Calculates a product quality score based on various market data points.
   * This score is a composite metric reflecting the product's overall health and performance.
   * @param productData - An object containing product metrics:
   *   - `reviews`: Number of reviews (can be null or undefined).
   *   - `rating`: Average product rating (e.g., out of 5).
   *   - `salesRank`: Best Seller Rank (lower is better).
   *   - `price`: Product price.
   *   - `category`: Product category.
   * @returns Product quality score (0-100), rounded to two decimal places.
   */
  static calculateProductScore(productData: {
    reviews: number | null | undefined;
    rating: number;
    salesRank: number;
    price: number;
    category: string;
  }): number {
    const { rating, reviews } = productData;

    // Normalize metrics to a 0-1 scale.
    // TODO: Replace these placeholder values with actual calculations based on real data
    // (e.g., conversion rate from sales/sessions, session data from reports).
    const normalizedConversion = 0.5;
    const normalizedSessions = 0.5;
    const normalizedRating = rating / 5; // Assuming rating is out of 5

    // Weight factors for each metric's contribution to the overall score.
    // These weights can be adjusted based on business priorities.
    const weights = {
      conversion: 0.3,
      sessions: 0.15,
      rating: 0.2,
      reviews: 0.05,
      priceComp: 0.1, // Placeholder for competitive pricing impact
      inventory: 0.1, // Placeholder for inventory health impact
    };

    // Calculate weighted score. Reviews are defaulted to 0 if null/undefined.
    // The contribution of 'reviews' might need further normalization if it's a raw count
    // and can vary significantly (e.g., log scale or percentile ranking).
    const score =
      normalizedConversion * weights.conversion +
      normalizedSessions * weights.sessions +
      normalizedRating * weights.rating +
      (reviews ?? 0) * weights.reviews; // Use nullish coalescing for reviews

    // Scale the score to 0-100 and cap at 100.
    return Number(Math.min(score * 100, 100).toFixed(2));
  }

  /**
   * Determines an optimal selling price for a product based on competitor pricing and product quality.
   * @param params - Parameters for optimal price calculation:
   *   - `competitorPrices`: An array of competitor product prices.
   *   - `productScore`: The calculated product quality score (expected 0-100).
   * @returns The calculated optimal price, rounded to two decimal places. Returns 0 if no competitor prices are provided.
   */
  static calculateOptimalPrice(params: OptimalPriceParams): number {
    const { competitorPrices, productScore } = params;

    // If no competitor prices, cannot determine an optimal price based on market.
    if (competitorPrices.length === 0) {
      console.warn(
        'No competitor prices provided for optimal price calculation. Returning 0.',
      );
      return 0;
    }

    // Calculate market metrics from competitor prices.
    const avgCompetitorPrice =
      competitorPrices.reduce((sum, price) => sum + price, 0) /
      competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Define price bounds to ensure the optimal price remains realistic.
    const lowerBound = minCompetitorPrice * 0.9; // 10% below min competitor price
    const upperBound = maxCompetitorPrice * 1.1; // 10% above max competitor price

    let optimalPrice = avgCompetitorPrice;

    // Adjust price based on product score.
    // The product score is scaled to a 0-1 range for proportional adjustment.
    const scaledScore = productScore / 100; // Assuming productScore is 0-100

    if (scaledScore > 0.8) {
      // If product score is high, price can be set higher than average competitor price.
      optimalPrice = avgCompetitorPrice * (1 + (scaledScore - 0.8) * 0.5);
    } else if (scaledScore < 0.6) {
      // If product score is low, price should be set lower than average competitor price.
      optimalPrice = avgCompetitorPrice * (1 - (0.6 - scaledScore) * 0.5);
    }

    // Ensure the calculated optimal price stays within the defined bounds.
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    return Number(optimalPrice.toFixed(2));
  }
}
