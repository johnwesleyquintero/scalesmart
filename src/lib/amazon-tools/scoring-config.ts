export interface ScoringRule {
  weight: number;
  thresholds: Array<{
    value: number;
    score: number;
    message?: string;
  }>;
  customScoring?: (value: any) => number;
}

export interface ScoringConfig {
  title: ScoringRule;
  bulletPoints: ScoringRule;
  description: ScoringRule;
  images: ScoringRule;
  reviews: ScoringRule;
  aPlus: ScoringRule;
  fulfillment: ScoringRule;
}

export const defaultScoringConfig: ScoringConfig = {
  title: {
    weight: 0.2,
    thresholds: [
      {
        value: 200,
        score: 5,
        message: 'Title exceeds maximum length of 200 characters',
      },
      { value: 150, score: 10, message: 'Optimal title length' },
      { value: 100, score: 8, message: 'Title could be more descriptive' },
      { value: 50, score: 6, message: 'Title is too short' },
      { value: 0, score: 4, message: 'Title needs significant improvement' },
    ],
  },
  bulletPoints: {
    weight: 0.2,
    thresholds: [],
    customScoring: (bullets: string[]) => {
      if (!bullets?.length) return 0;
      const count = bullets.length;
      const avgLength =
        bullets.reduce((sum, bullet) => sum + bullet.length, 0) / count;

      let score = 0;
      score += Math.min(count, 5) * 1.5;
      if (avgLength >= 150 && avgLength <= 200) score += 2.5;
      else if (avgLength >= 100) score += 1.5;

      return Math.min(score, 10);
    },
  },
  description: {
    weight: 0.15,
    thresholds: [
      {
        value: 2000,
        score: 10,
        message: 'Optimal description length with HTML formatting',
      },
      { value: 1500, score: 8, message: 'Good description length' },
      { value: 1000, score: 6, message: 'Description could be more detailed' },
      { value: 500, score: 4, message: 'Description needs expansion' },
      { value: 0, score: 0, message: 'Missing description' },
    ],
  },
  images: {
    weight: 0.15,
    thresholds: [
      { value: 9, score: 10, message: 'Maximum number of images' },
      { value: 7, score: 8, message: 'Good number of images' },
      { value: 5, score: 6, message: 'Could use more images' },
      { value: 3, score: 4, message: 'Needs more images' },
      { value: 0, score: 0, message: 'No images' },
    ],
  },
  reviews: {
    weight: 0.15,
    thresholds: [],
    customScoring: ({ rating, count }: { rating: number; count: number }) => {
      if (!rating || !count) return 0;
      let score = (rating / 5) * 5;

      if (count >= 1000) score += 5;
      else if (count >= 500) score += 4;
      else if (count >= 100) score += 3;
      else if (count >= 50) score += 2;
      else score += 1;

      return Math.min(score, 10);
    },
  },
  aPlus: {
    weight: 0.1,
    thresholds: [
      { value: 1, score: 10, message: 'Has A+ Content' },
      { value: 0, score: 0, message: 'No A+ Content' },
    ],
  },
  fulfillment: {
    weight: 0.05,
    thresholds: [
      { value: 1, score: 10, message: 'FBA fulfillment' },
      { value: 0, score: 5, message: 'Non-FBA fulfillment' },
    ],
  },
};

export const validateScoringConfig = (config: ScoringConfig): boolean => {
  const totalWeight = Object.values(config).reduce(
    (sum, rule) => sum + rule.weight,
    0,
  );
  return Math.abs(totalWeight - 1) < 0.0001; // Allow for floating-point imprecision
};

export const getScoreMessage = (
  rule: ScoringRule,
  value: number,
): string | undefined => {
  if (!rule.thresholds.length) return undefined;

  const threshold = rule.thresholds.find((t) => value >= t.value);
  return threshold?.message;
};
