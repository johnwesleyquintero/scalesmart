export const dynamic = 'force-static';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

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
      return new NextResponse('Failed to read file', { status: 500 });
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
    return new NextResponse('File not found', { status: 404 });
  }
}
