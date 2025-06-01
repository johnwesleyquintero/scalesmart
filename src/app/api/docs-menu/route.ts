import { NextResponse } from 'next/server';
import { getAllDocsMetadata } from '@/lib/docs-data/static-docs';

export async function GET() {
  try {
    const docsMetadata = getAllDocsMetadata();
    return NextResponse.json(docsMetadata);
  } catch (error) {
    console.error('Failed to fetch docs metadata:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}