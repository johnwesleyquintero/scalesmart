import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { z } from 'zod';
const prohibitedKeywordsSchema = z.array(z.string());

export async function POST(request: Request) {
  const filePath = path.join(process.cwd(), 'data', 'prohibited-keywords.json');

  try {
    const data = prohibitedKeywordsSchema.parse(await request.json());
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Failed to update keywords: Invalid data format' },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to update keywords' },
        { status: 500 },
      );
    }
  }
}
