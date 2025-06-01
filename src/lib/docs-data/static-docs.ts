import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const DOCS_CONTENT_PATH = join(process.cwd(), 'src/app/content/docs');

export interface DocArticleMetadata {
  slug: string;
  title: string;
  description: string;
  category: string;
  order: number;
  tags?: string[];
}

export function getAllDocSlugs() {
  const files = readdirSync(DOCS_CONTENT_PATH);

  return files.map((filename) => ({
    params: {
      slug: filename.replace(/\.mdx$/, ''),
    },
  }));
}

export function getDocBySlug(slug: string): { content: string; data: DocArticleMetadata } {
  const fullPath = join(DOCS_CONTENT_PATH, `${slug}.mdx`);
  const fileContents = readFileSync(fullPath, 'utf8');

  const { data, content } = matter(fileContents);

  return {
    content,
    data: data as DocArticleMetadata,
  };
}

export function getAllDocsMetadata(): DocArticleMetadata[] {
  const files = readdirSync(DOCS_CONTENT_PATH);

  const allDocsData = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const fullPath = join(DOCS_CONTENT_PATH, filename);
    const fileContents = readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    const metadata = data as DocArticleMetadata;
    return {
      ...metadata,
      slug: slug,
    };
  });

  return allDocsData.sort((a, b) => {
    const categoryA = a.category || ''; // Fallback to empty string
    const categoryB = b.category || ''; // Fallback to empty string

    if (categoryA === categoryB) {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      const titleA = a.title || ''; // Fallback to empty string
      const titleB = b.title || ''; // Fallback to empty string
      return titleA.localeCompare(titleB);
    }
    return categoryA.localeCompare(categoryB);
  });
}