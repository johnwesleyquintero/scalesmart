import { KeywordTrackingData } from '@/types/amazon-tools';

interface KeywordRecommendation {
  keyword: string;
  reason: string;
  suggestedPlacement: 'Title' | 'Bullet Points' | 'Backend Keywords';
}

/**
 * Generates AI-powered keyword recommendations based on tracking data.
 * @param keywordData - An array of keyword tracking data.
 * @returns A string containing formatted recommendations.
 */
export function generateKeywordRecommendations(
  keywordData: KeywordTrackingData[],
): string {
  if (!keywordData || keywordData.length === 0) {
    return 'No keyword data provided to generate recommendations.';
  }

  const recommendations: KeywordRecommendation[] = [];

  // 1. Identify high-potential keywords (high search volume, low competition)
  const highPotentialKeywords = keywordData
    .filter(
      (k) =>
        (k.searchVolume || 0) > 1000 &&
        (parseFloat(k.competition as string) || 1) < 0.5,
    ) // Ensure competition is a number
    .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0))
    .slice(0, 3);

  highPotentialKeywords.forEach((k) => {
    recommendations.push({
      keyword: k.keyword || 'N/A',
      reason: `High search volume (${k.searchVolume}) with low competition (${k.competition}).`,
      suggestedPlacement: 'Title',
    });
  });

  // 2. Suggest long-tail keywords based on existing high-volume keywords
  const highVolumeKeywords = keywordData
    .filter((k) => (k.searchVolume || 0) > 5000)
    .slice(0, 2);

  highVolumeKeywords.forEach((k) => {
    if (k.keyword) {
      recommendations.push({
        keyword: `${k.keyword} for beginners`,
        reason: `Long-tail variation of a high-volume keyword.`,
        suggestedPlacement: 'Bullet Points',
      });
      recommendations.push({
        keyword: `best ${k.keyword} under $50`,
        reason: `Long-tail variation targeting a specific price point.`,
        suggestedPlacement: 'Backend Keywords',
      });
    }
  });

  // 3. Identify keywords with low rank but high search volume
  const lowRankHighVolume = keywordData
    .filter((k) => (k.rank || 0) > 10 && (k.searchVolume || 0) > 2000)
    .slice(0, 2);

  lowRankHighVolume.forEach((k) => {
    recommendations.push({
      keyword: k.keyword || 'N/A',
      reason: `High search volume (${k.searchVolume}) but low rank (${k.rank}). Needs optimization.`,
      suggestedPlacement: 'Title',
    });
  });

  if (recommendations.length === 0) {
    return 'No specific recommendations could be generated from the provided data. Consider uploading more comprehensive keyword tracking files.';
  }

  // Format the recommendations into a readable string
  return `
    AI-Powered Keyword Recommendations:
    ${recommendations
      .map(
        (rec) =>
          `\n- Keyword: "${rec.keyword}"\n  - Reason: ${rec.reason}\n  - Suggested Placement: ${rec.suggestedPlacement}`,
      )
      .join('')}
  `;
}
