import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import rehypeReact from 'rehype-react';
import React from 'react';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/docs/error-guide.mdx');
    const mdxSource = readFileSync(filePath, 'utf8');

    const result = await remark()
      .use(remarkMdx)
      .use(rehypeReact, { createElement: React.createElement })
      .process(mdxSource);

    const content = String(result);

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error reading error-guide.mdx', {
      status: 500,
    });
  }
}
