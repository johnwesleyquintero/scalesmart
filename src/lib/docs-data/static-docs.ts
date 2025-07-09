import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { DocPost, DocsJsonData } from '@/types'; // Import DocsJsonData

// IMPORTANT: This import assumes a docs.json file will be generated at build time
// containing all documentation content. This file is crucial for production deployments
// where direct file system access to MDX files might not be available.
// The structure of the imported JSON data should be { "docs": DocPost[] }.
import rawDocsData from '@/data/portfolio-data/docs.json';

// Assert the type of the imported JSON data.
const docsData: DocsJsonData = rawDocsData as DocsJsonData;

const DOCS_CONTENT_PATH = join(process.cwd(), 'src/app/content/docs');
const UNTITLED_DOC_TITLE = 'Untitled Document'; // Define the constant

export interface DocArticleMetadata {
  slug: string;
  title: string;
  description: string;
  category: string;
  order: number;
  tags?: string[];
  [key: string]: unknown; // Add index signature to allow for other properties
}

export function getAllDocSlugs() {
  // In production, always use the pre-generated JSON data.
  if (process.env.NODE_ENV === 'production') {
    console.log('[Docs Data] Production mode: Using JSON data for doc slugs.');
    return docsData.docs.map((doc: DocPost) => ({
      params: {
        slug: doc.slug,
      },
    }));
  }

  // In development, read from the file system for convenience.
  if (!existsSync(DOCS_CONTENT_PATH)) {
    console.warn(
      '[Docs Data] Development mode: Docs content path not found. Falling back to JSON data.',
    );
    return docsData.docs.map((doc: DocPost) => ({
      params: {
        slug: doc.slug,
      },
    }));
  }

  const files = readdirSync(DOCS_CONTENT_PATH);

  return files.map((filename) => ({
    params: {
      slug: filename.replace(/\.mdx$/, ''),
    },
  }));
}

export function getDocBySlug(slug: string): {
  content: string;
  data: DocArticleMetadata;
} {
  // In production, always use the pre-generated JSON data.
  if (process.env.NODE_ENV === 'production') {
    console.log(
      `[Docs Data] Production mode: Using JSON data for doc slug: ${slug}`,
    );
    const doc = docsData.docs.find((d: DocPost) => d.slug === slug);
    if (doc) {
      return {
        content: doc.content || '', // Provide fallback for content
        data: {
          slug: doc.slug,
          title: doc.title || UNTITLED_DOC_TITLE,
          description: doc.description || '',
          category: doc.category || 'Uncategorized',
          order: doc.order || 0,
          tags: doc.tags || [],
        },
      };
    } else {
      throw new Error(`Doc with slug ${slug} not found in JSON data.`);
    }
  }

  // In development, read from the file system for convenience.
  const fullPath = join(DOCS_CONTENT_PATH, `${slug}.mdx`);
  if (!existsSync(fullPath)) {
    console.warn(
      `[Docs Data] Development mode: Doc file not found for slug ${slug}. Falling back to JSON data.`,
    );
    const doc = docsData.docs.find((d: DocPost) => d.slug === slug);
    if (doc) {
      return {
        content: doc.content || '',
        data: {
          slug: doc.slug,
          title: doc.title || UNTITLED_DOC_TITLE,
          description: doc.description || '',
          category: doc.category || 'Uncategorized',
          order: doc.order || 0,
          tags: doc.tags || [],
        },
      };
    } else {
      throw new Error(
        `Doc with slug ${slug} not found in JSON data (after file system fallback).`,
      );
    }
  }

  const fileContents = readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    content,
    data: data as DocArticleMetadata,
  };
}

export function getAllDocsMetadata(): DocArticleMetadata[] {
  // In production, always use the pre-generated JSON data.
  if (process.env.NODE_ENV === 'production') {
    console.log(
      '[Docs Data] Production mode: Using JSON data for all docs metadata.',
    );
    return docsData.docs.map((doc: DocPost) => ({
      slug: doc.slug,
      title: doc.title || UNTITLED_DOC_TITLE,
      description: doc.description || '',
      category: doc.category || 'Uncategorized',
      order: doc.order || 0,
      tags: doc.tags || [],
    }));
  }

  // In development, read from the file system for convenience.
  if (!existsSync(DOCS_CONTENT_PATH)) {
    console.warn(
      '[Docs Data] Development mode: Docs content path not found. Falling back to JSON data for metadata.',
    );
    return docsData.docs.map((doc: DocPost) => ({
      slug: doc.slug,
      title: doc.title || UNTITLED_DOC_TITLE,
      description: doc.description || '',
      category: doc.category || 'Uncategorized',
      order: doc.order || 0,
      tags: doc.tags || [],
    }));
  }

  const files = readdirSync(DOCS_CONTENT_PATH);

  const allDocsData = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const fullPath = join(DOCS_CONTENT_PATH, filename);
    const fileContents = readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents); // Only need data for metadata

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
