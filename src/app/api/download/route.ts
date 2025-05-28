export const dynamic = 'force-static';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'data',
      'amazon-tools-sample-data',
      'sample_amazon_data.csv',
    );
    let fileBuffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch (error: unknown) {
      console.error('Error reading file:', error);
      return NextResponse.json(
        createErrorResponse('Failed to read file', 'FILE_READ_ERROR'),
        { status: 500 },
      );
    }

    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sample_amazon_data.csv"',
      'Access-Control-Allow-Origin': '*',
    };

    return new NextResponse(fileBuffer, {
      headers: headers,
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(handleApiError(error), { status: 404 });
  }
}
