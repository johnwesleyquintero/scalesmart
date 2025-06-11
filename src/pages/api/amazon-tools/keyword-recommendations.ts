import { NextApiRequest, NextApiResponse } from 'next';
import { generateKeywordRecommendations } from '@/lib/amazon-tools/keywordRecommendationsAI';
import { KeywordTrackingData } from '@/types/amazon-tools';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { keywordData } = req.body as { keywordData: KeywordTrackingData[] };

  if (!keywordData || !Array.isArray(keywordData)) {
    return res.status(400).json({
      error: 'Invalid input: keywordData is required and must be an array.',
    });
  }

  try {
    const recommendation = await generateKeywordRecommendations(keywordData);
    res.status(200).json({ recommendation });
  } catch (error) {
    console.error('API error generating keyword recommendations:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while generating keyword recommendations.',
    });
  }
}
