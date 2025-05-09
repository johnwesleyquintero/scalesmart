import { KeywordIntelligence } from '../keyword-intelligence';

export async function fetchKeywordAnalysis(keywords: string[]) {
  try {
    return await KeywordIntelligence.analyze(keywords);
  } catch (error) {
    console.error('API Route Error:', error);
    throw new Error('Failed to analyze keywords');
  }
}
