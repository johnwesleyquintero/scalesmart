import { ProhibitedKeywords } from './prohibited-keywords';

export interface KeywordAnalysis {
  keyword: string;
  isProhibited: boolean;
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'pattern';
  reason?: string;
}

interface KeywordMetrics {
  length: number;
  wordCount: number;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
}

export const KeywordIntelligence = {
  async analyze(keywords: string[]): Promise<KeywordAnalysis[]> {
    console.log('analyze called');
    const prohibitedKeywords = await ProhibitedKeywords.getAll();
    return Promise.all(
      keywords.map(async (keyword) =>
        this.analyzeKeyword(keyword, prohibitedKeywords),
      ),
    );
  },

  async analyzeKeyword(
    keyword: string,
    prohibitedKeywords: string[],
  ): Promise<KeywordAnalysis> {
    const metrics = this.calculateMetrics(keyword);
    const isProhibited = this.checkProhibited(keyword, prohibitedKeywords);
    const score = this.calculateScore(metrics);

    return {
      keyword,
      isProhibited,
      score,
      confidence: this.calculateConfidence(metrics),
      matchType: this.determineMatchType(keyword),
      reason: this.generateReason(metrics, isProhibited),
    };
  },

  calculateMetrics(keyword: string): KeywordMetrics {
    return {
      length: keyword.length,
      wordCount: keyword.split(/\s+/).length,
      hasNumbers: /\d/.test(keyword),
      hasSpecialChars: /[^a-zA-Z0-9\s]/.test(keyword),
    };
  },

  checkProhibited(keyword: string, prohibitedKeywords: string[]): boolean {
    const lowerKeyword = keyword.toLowerCase();
    return prohibitedKeywords.some((prohibited) =>
      lowerKeyword.includes(prohibited.toLowerCase()),
    );
  },

  calculateScore(metrics: KeywordMetrics): number {
    let score = 100;

    // Penalize extremely short or long keywords
    if (metrics.length < 3) score -= 30;
    if (metrics.length > 50) score -= 20;

    // Penalize keywords with too many words
    if (metrics.wordCount > 7) score -= 15;

    // Slight penalty for numbers unless it's a model number pattern
    if (metrics.hasNumbers && !this.isModelNumber(metrics)) score -= 10;

    // Penalize special characters unless it's common in product names
    if (metrics.hasSpecialChars) score -= 5;

    return Math.max(0, Math.min(100, score));
  },

  calculateConfidence(metrics: KeywordMetrics): number {
    // Base confidence on word count and length
    let confidence = 100;
    if (metrics.wordCount < 2) confidence -= 20;
    if (metrics.length < 5) confidence -= 15;
    if (metrics.hasSpecialChars && metrics.hasNumbers) confidence -= 10;

    return Math.max(0, Math.min(100, confidence)) / 100;
  },

  determineMatchType(keyword: string): 'exact' | 'fuzzy' | 'pattern' {
    if (this.isModelNumber({ hasNumbers: /\d/.test(keyword) }))
      return 'pattern';
    if (keyword.includes('*') || keyword.includes('?')) return 'fuzzy';
    return 'exact';
  },

  isModelNumber(metrics: { hasNumbers?: boolean }): boolean {
    return metrics.hasNumbers === true;
  },

  generateReason(metrics: KeywordMetrics, isProhibited: boolean): string {
    if (isProhibited) return 'Keyword contains prohibited terms';
    if (metrics.length < 3) return 'Keyword is too short';
    if (metrics.length > 50) return 'Keyword is too long';
    if (metrics.wordCount > 7) return 'Too many words in keyword';
    return 'Keyword analysis completed';
  },
};
