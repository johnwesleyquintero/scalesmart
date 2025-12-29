import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { loadStaticData } from '@/lib/load-static-data';

export async function GET() {
  try {
    const data = await loadStaticData('prohibited-keywords');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
