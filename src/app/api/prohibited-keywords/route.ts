// import fs from 'fs/promises'; // No longer needed since POST is commented out
import { NextResponse } from 'next/server';
// import path from 'path'; // No longer needed
// import { z } from 'zod'; // No longer needed
// const prohibitedKeywordsSchema = z.array(z.string()); // No longer needed

// Assuming your prohibited keywords JSON file is located at 'src/data/prohibited-keywords.json'
// Adjust the path if it's located elsewhere.
import prohibitedKeywordsData from '@/data/prohibited-keywords.json';

export async function GET() {
  try {
    // Return the directly imported JSON data.
    // Next.js will handle bundling this JSON file correctly.
    return NextResponse.json(prohibitedKeywordsData);
  } catch (error) {
    console.error(
      'Error serving prohibited keywords list from API route:',
      error,
    );
    return NextResponse.json(
      {
        error:
          'Failed to load prohibited keywords list. Please check server logs.',
      },
      { status: 500 },
    );
  }
}

// export async function POST(request: Request) {
//   const filePath = path.join(process.cwd(), 'data', 'prohibited-keywords.json');
//
//   try {
//     const data = prohibitedKeywordsSchema.parse(await request.json());
//     await fs.writeFile(filePath, JSON.stringify(data, null, 2));
//     return NextResponse.json({ success: true });
//   } catch (error: unknown) {
//     console.error(error);
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Failed to update keywords: Invalid data format' },
//         { status: 400 },
//       );
//     } else {
//       return NextResponse.json(
//         { error: 'Failed to update keywords' },
//         { status: 500 },
//       );
//     }
//   }
// }
