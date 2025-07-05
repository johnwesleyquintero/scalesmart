import { NextResponse } from 'next/server';
import { generateKeywordRecommendations } from '@/lib/amazon-tools/keywordRecommendationsAI';
import { KeywordTrackingData } from '@/types/amazon-tools';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keywordData } = body;

    if (!keywordData || !Array.isArray(keywordData)) {
      return NextResponse.json(
        { error: 'Invalid keyword data provided.' },
        { status: 400 },
      );
    }

    const recommendation = generateKeywordRecommendations(
      keywordData as KeywordTrackingData[],
    );

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Error in keyword recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to generate keyword recommendations.' },
      { status: 500 },
    );
  }
}
