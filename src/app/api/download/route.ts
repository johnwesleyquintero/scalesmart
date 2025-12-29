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
      console.error('Error reading sample data file:', error);
      return NextResponse.json(
        createErrorResponse(
          'Failed to read sample data file',
          'FILE_READ_ERROR',
        ),
        { status: 500 },
      );
    }

    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sample_amazon_data.csv"',
    };

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('Error in download route:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
