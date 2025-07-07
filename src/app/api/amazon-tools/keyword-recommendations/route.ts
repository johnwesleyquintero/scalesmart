import { NextResponse } from 'next/server';
import { generateKeywordRecommendations } from '@/lib/amazon-tools/keywordRecommendationsAI';
import { handleApiError } from '@/lib/api-error-handler';
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
  } catch (error: unknown) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
