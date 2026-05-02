import fs, { existsSync } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { z } from 'zod';
import { cache } from 'react';
import { BlogPost, DocPost } from '@/types';
import {
  DEFAULT_DOC_TITLE,
  INTRODUCTION_SLUG,
  INTRODUCTION_TITLE,
  RELATED_DOCS_COUNT,
  DEFAULT_DOC_VERSION,
} from '@/config/docs';

const EMPTY_STRING = '';
const DEFAULT_READING_TIME = '5 min read';
const DEFAULT_AUTHOR = 'Wesley Quintero';

const STR_MDX = 'mdx';
const STR_MD = 'md';
const EXT_MDX = `.${STR_MDX}`;
const EXT_MD = `.${STR_MD}`;
const UTF8 = 'utf8';

const blogMatterDataSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(EMPTY_STRING),
  date: z.union([z.string(), z.date()]).optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  author: z.string().optional(),
  type: z
    .enum(['blog', 'article', 'case-study', 'playbook'])
    .optional()
    .default('blog'),
});

const docMatterDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().default(EMPTY_STRING),
  date: z.union([z.string(), z.date()]).optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  author: z.string().optional(),
  type: z.enum(['doc']).optional().default('doc'),
  last_updated: z.string().optional(),
  version: z.string().optional(),
});

function normalizeDate(date: string | Date): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.warn(
        `WARNING: Invalid date encountered: ${date}. Using current date.`,
      );
      return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  } catch (err) {
    console.error(`ERROR: Failed to normalize date ${date}:`, err);
    return new Date().toISOString().split('T')[0];
  }
}

function getBlogDirectory() {
  return path.join(process.cwd(), 'src', 'app', 'content', 'blog');
}
function getDocsDirectory() {
  return path.join(process.cwd(), 'src', 'app', 'content', 'docs');
}
function getStaticDirectory() {
  return path.join(process.cwd(), 'src', 'app', 'content', 'static');
}

const MARKDOWN_FILE_EXTENSIONS = [EXT_MDX, EXT_MD];
const MARKDOWN_FILE_REGEX = new RegExp(`\\.(${STR_MDX}|${STR_MD})$`);

/**
 * Reads all MDX/MD files from a given directory (non-recursively for docs).
 * @param directory - The directory to scan.
 * @param fileList - An array to accumulate the full paths of found files.
 */
function readFilesFlat(directory: string, fileList: string[]) {
  if (!fs.existsSync(directory)) {
    console.warn(`WARNING: Directory not found: ${directory}`);
    return;
  }
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (
      stat.isFile() &&
      MARKDOWN_FILE_EXTENSIONS.some((ext) => file.endsWith(ext))
    ) {
      fileList.push(fullPath);
    }
  }
}

export const getAllBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const blogPostsDirectory = getBlogDirectory();
  try {
    if (!fs.existsSync(blogPostsDirectory)) {
      console.warn(
        `WARNING: Blog directory not found at ${blogPostsDirectory}`,
      );
      return [];
    }

    const fileNames = fs.readdirSync(blogPostsDirectory);
    const allPostsData = await Promise.all(
      fileNames
        .filter((fileName): boolean =>
          MARKDOWN_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext)),
        )
        .map(async (fileName) => {
          const slug = fileName.replace(MARKDOWN_FILE_REGEX, '');
          const fullPath = path.join(blogPostsDirectory, fileName);
          const fileContents = fs.readFileSync(fullPath, UTF8);
          const parsed = matter(fileContents);
          const data = blogMatterDataSchema.parse(parsed.data);

          return {
            id: slug,
            slug: slug,
            title: data.title,
            description: data.description,
            date: normalizeDate(data.date || new Date()),
            image: data.image || `/images/blog/${slug}.svg`,
            tags: data.tags || [],
            readingTime: data.readingTime || DEFAULT_READING_TIME,
            author: data.author || DEFAULT_AUTHOR,
            type: data.type,
            content: parsed.content,
          } as BlogPost;
        }),
    );

    return allPostsData.sort((a: BlogPost, b: BlogPost) =>
      normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
    );
  } catch (error) {
    console.error('ERROR in getAllBlogPosts:', error);
    return [];
  }
});

export async function getAllDocPosts(): Promise<DocPost[]> {
  const docsDirectory = getDocsDirectory();
  const docFiles: string[] = [];
  readFilesFlat(docsDirectory, docFiles); // Use readFilesFlat for docs

  const allDocsData = await Promise.all(
    docFiles.map((fullPath) => processContentFile(fullPath, 'doc')),
  );

  return allDocsData
    .filter((doc): doc is DocPost => doc !== undefined)
    .sort((a: DocPost, b: DocPost) =>
      normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
    );
}

function deriveContentSlug(
  fullPath: string,
  baseDir: string,
  fileType: 'doc',
): string {
  let relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
  let slug = relativePath.replace(MARKDOWN_FILE_REGEX, '');

  // Special handling for 'index' file at the root of docs
  if (fileType === 'doc' && slug === 'index') {
    return ''; // Map 'index' to the root slug for /docs
  }

  return slug;
}

function deriveContentTitle(
  slug: string,
  frontmatterTitle?: string,
  fileType: 'doc' = 'doc',
): string {
  if (frontmatterTitle) {
    return frontmatterTitle;
  }
  if (slug === INTRODUCTION_SLUG && fileType === 'doc') {
    return INTRODUCTION_TITLE;
  }
  if (slug === '' && fileType === 'doc') {
    return DEFAULT_DOC_TITLE;
  }

  const defaultTitle = DEFAULT_DOC_TITLE;

  const titleFromSlug =
    slug
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || defaultTitle;

  return titleFromSlug;
}

async function processContentFile(
  fullPath: string,
  fileType: 'doc',
): Promise<DocPost | undefined> {
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(fullPath, UTF8);
  } catch (err) {
    console.error(`ERROR: Could not read file ${fullPath}:`, err);
    return undefined;
  }

  let parsed: matter.GrayMatterFile<string>;
  console.log(`[MDX Debug] Attempting to parse frontmatter for: ${fullPath}`);
  try {
    parsed = matter(fileContents);
  } catch (err) {
    console.error(`ERROR: Could not parse frontmatter in ${fullPath}:`, err);
    return undefined;
  }

  let contentFrontmatter: z.infer<typeof docMatterDataSchema>;
  try {
    contentFrontmatter = docMatterDataSchema.parse(parsed.data);
  } catch (error) {
    console.warn(
      `Frontmatter validation error in ${fullPath}. Using defaults. Error:`,
      error,
    );
    contentFrontmatter = {
      title: undefined,
      description: EMPTY_STRING,
      date: undefined,
      image: undefined,
      tags: [],
      readingTime: undefined,
      author: undefined,
      type: fileType,
      last_updated: undefined,
      version: undefined,
    };
  }

  const baseDir = getDocsDirectory();
  const currentSlug = deriveContentSlug(fullPath, baseDir, fileType);

  const currentTitle = deriveContentTitle(
    currentSlug,
    contentFrontmatter.title,
    fileType,
  );

  const finalType = contentFrontmatter.type || fileType;

  return {
    id: currentSlug,
    slug: currentSlug,
    title: currentTitle,
    description: contentFrontmatter.description,
    date: normalizeDate(contentFrontmatter.date || new Date()),
    image: contentFrontmatter.image || `/images/${fileType}/${currentSlug}.svg`,
    tags: contentFrontmatter.tags || [],
    readingTime: contentFrontmatter.readingTime || DEFAULT_READING_TIME,
    author: contentFrontmatter.author || DEFAULT_AUTHOR,
    type: finalType,
    content: parsed.content,
    fileName: path.basename(fullPath),
    last_updated: contentFrontmatter.last_updated,
    version: contentFrontmatter.version || DEFAULT_DOC_VERSION,
  } as DocPost;
}

interface ContentData {
  id: string;
  title: string;
  description: string;
  slug: string;
  date: string; // Added date property
  tags?: string[];
}

function findBlogPostFile(slug: string): string | undefined {
  const blogPostsDirectory = getBlogDirectory();
  const lowerSlug = slug.toLowerCase();
  for (const ext of MARKDOWN_FILE_EXTENSIONS) {
    const filePath = path.join(blogPostsDirectory, `${lowerSlug}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return undefined;
}

export const getBlogPostBySlug = cache(
  async (slug: string): Promise<BlogPost | undefined> => {
    // If blogPostsDirectory does not exist, this function will return undefined, which is handled by notFound() in page.tsx
    // The fallback to blog.json is removed as it's not the primary content source and causes module not found errors.

    try {
      const fullPath = findBlogPostFile(slug);
      if (!fullPath) {
        console.warn(
          `WARNING: Could not find blog post file for slug: ${slug}`,
        );
        return undefined;
      }

      let fileContents: string;
      try {
        fileContents = fs.readFileSync(fullPath, UTF8);
      } catch (err) {
        console.error(`ERROR: Could not read blog file ${fullPath}:`, err);
        return undefined;
      }
      console.log(
        `[MDX Debug] Processing specific blog post by slug: ${fullPath}`,
      );
      const parsed = matter(fileContents);
      const data = blogMatterDataSchema.parse(parsed.data);
      const { content } = parsed;

      const allPosts = await getAllBlogPosts();
      const relatedPosts = allPosts
        .filter(
          (post: BlogPost): boolean =>
            post.slug !== slug &&
            (post.tags ?? []).some(
              (tag: string): boolean => data.tags?.includes(tag) ?? false,
            ),
        )
        .slice(0, 2)
        .map((p: BlogPost) => ({
          // Changed type to BlogPost for clarity and correct property access
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          date: p.date, // Added date property
        }));

      return {
        id: slug,
        slug,
        title: data.title,
        description: data.description,
        date: normalizeDate(data.date || new Date()),
        image: data.image || `/images/blog/${slug}.svg`,
        tags: data.tags || [],
        readingTime: data.readingTime || DEFAULT_READING_TIME,
        author: data.author || DEFAULT_AUTHOR,
        type: data.type,
        content,
        relatedPosts,
      };
    } catch (e) {
      console.error(`Error processing blog post ${slug}:`, e);
      return undefined;
    }
  },
);

function findContentFile(
  slug: string,
  baseDir: string,
  fileType: 'doc',
): string | undefined {
  for (const ext of MARKDOWN_FILE_EXTENSIONS) {
    const filePath = path.join(baseDir, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return undefined;
}

export const getDocPostBySlug = cache(
  async (slug: string): Promise<DocPost | undefined> => {
    const docsDirectory = getDocsDirectory();
    // Special handling for the root docs page (slug is empty string)
    const actualSlug = slug === '' ? 'index' : slug;
    const lowerSlug = actualSlug.toLowerCase();
    const fullPath = findContentFile(lowerSlug, docsDirectory, 'doc');

    if (!fullPath) {
      console.warn(`WARNING: Could not find doc post file for slug: ${slug}`);
      return undefined;
    }

    try {
      return processContentFile(fullPath, 'doc');
    } catch (e) {
      console.error('Error in getDocPostBySlug', e);
      return undefined;
    }
  },
);

/**
 * Fetches static content (e.g., Privacy Policy, Terms) by its slug.
 * @param slug - The slug of the static content.
 * @returns An object containing the content and frontmatter, or undefined if not found.
 */
export const getStaticContentBySlug = cache(
  async (
    slug: string,
  ): Promise<
    { content: string; data: Record<string, unknown> } | undefined
  > => {
    const staticContentDirectory = getStaticDirectory();
    const lowerSlug = slug.toLowerCase();
    let fullPath = '';

    for (const ext of MARKDOWN_FILE_EXTENSIONS) {
      const p = path.join(staticContentDirectory, `${lowerSlug}${ext}`);
      if (fs.existsSync(p)) {
        fullPath = p;
        break;
      }
    }

    if (!fullPath) {
      console.warn(`WARNING: Static content not found for slug: ${slug}`);
      return undefined;
    }

    try {
      const fileContents = fs.readFileSync(fullPath, UTF8);
      const { data, content } = matter(fileContents);
      return { data, content };
    } catch (error) {
      console.error(`Error reading static MDX file for slug ${slug}:`, error);
      return undefined;
    }
  },
);
