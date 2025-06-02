import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { z } from 'zod';
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
  type: z.enum(['blog', 'article', 'case-study']).optional().default('blog'),
});

const docMatterDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().default(EMPTY_STRING),
  date: z.union([z.string(), z.date()]).optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  author: z.string().optional(),
  type: z.enum(['doc', 'academy']).optional().default('doc'),
  last_updated: z.string().optional(),
  version: z.string().optional(),
});

function normalizeDate(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

const blogPostsDirectory = path.join(process.cwd(), 'src/app/content/blog');
const docsDirectory = path.join(process.cwd(), 'src/app/content/docs');
const academyArticlesDirectory = path.join(
  process.cwd(),
  'src/app/content/academy',
);

const MARKDOWN_FILE_EXTENSIONS = [EXT_MDX, EXT_MD];
const MARKDOWN_FILE_REGEX = new RegExp(`\\.(${STR_MDX}|${STR_MD})$`);

/**
 * Reads all MDX/MD files from a given directory (non-recursively for docs).
 * @param directory - The directory to scan.
 * @param fileList - An array to accumulate the full paths of found files.
 */
function readFilesFlat(directory: string, fileList: string[]) {
  if (!fs.existsSync(directory)) {
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

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(blogPostsDirectory)) {
    return [];
  }
  const fileNames = fs.readdirSync(blogPostsDirectory);
  const allPostsData = await Promise.all(
    fileNames
      .filter((fileName): boolean =>
        MARKDOWN_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext)),
      )
      .map((fileName) => {
        const slug = fileName.replace(MARKDOWN_FILE_REGEX, '');
        const fullPath = path.join(blogPostsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, UTF8);
        console.log(`[MDX Debug] Processing blog post: ${fullPath}`);
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
          content: EMPTY_STRING,
        } as BlogPost;
      }),
  );

  return allPostsData.sort((a: BlogPost, b: BlogPost) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
}

export async function getAllDocPosts(): Promise<DocPost[]> {
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

export async function getAllAcademyArticles(): Promise<DocPost[]> {
  const academyFiles: string[] = [];
  readFilesFlat(academyArticlesDirectory, academyFiles); // Use readFilesFlat for academy

  const allAcademyArticlesData = await Promise.all(
    academyFiles.map((fullPath) => processContentFile(fullPath, 'academy')),
  );

  return allAcademyArticlesData
    .filter((article): article is DocPost => article !== undefined)
    .sort((a: DocPost, b: DocPost) =>
      normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
    );
}

function deriveContentSlug(
  fullPath: string,
  baseDir: string,
  fileType: 'doc' | 'academy',
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
  fileType: 'doc' | 'academy' = 'doc',
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

  const defaultTitle =
    fileType === 'academy' ? 'Untitled Academy Article' : DEFAULT_DOC_TITLE;

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
  fileType: 'doc' | 'academy',
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

  const baseDir = fileType === 'doc' ? docsDirectory : academyArticlesDirectory;
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
  tags?: string[];
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  if (!fs.existsSync(blogPostsDirectory)) {
    const blogData = await import('@/data/portfolio-data/blog.json');
    const post = blogData.posts.find((post: ContentData) => post.id === slug);

    if (!post) return undefined;

    const allPosts = blogData.posts;
    const relatedPosts = allPosts
      .filter(
        (p: ContentData) =>
          p.id !== slug &&
          p.tags?.some((tag: string) => post.tags?.includes(tag) ?? false),
      )
      .slice(0, 2)
      .map((p: ContentData) => ({
        id: p.id,
        slug: p.id,
        title: p.title,
        description: p.description,
      }));

    return {
      ...post,
      relatedPosts,
    };
  }

  try {
    const fullPath = path.join(blogPostsDirectory, `${slug}.mdx`);
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
      .map((p: ContentData) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
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
}

function findContentFile(
  slug: string,
  baseDir: string,
  fileType: 'doc' | 'academy',
): string | undefined {
  for (const ext of MARKDOWN_FILE_EXTENSIONS) {
    const filePath = path.join(baseDir, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return undefined;
}

export async function getDocPostBySlug(
  slug: string,
): Promise<DocPost | undefined> {
  // Special handling for the root docs page (slug is empty string)
  const actualSlug = slug === '' ? 'index' : slug;
  const fullPath = findContentFile(actualSlug, docsDirectory, 'doc');

  if (!fullPath) {
    return undefined;
  }

  try {
    return processContentFile(fullPath, 'doc');
  } catch (e) {
    console.error('Error in getDocPostBySlug', e);
    return undefined;
  }
}

export async function getAcademyArticleBySlug(
  slug: string,
): Promise<DocPost | undefined> {
  const fullPath = findContentFile(slug, academyArticlesDirectory, 'academy');

  if (!fullPath) {
    return undefined;
  }

  try {
    const article = await processContentFile(fullPath, 'academy');

    if (article) {
      const allAcademyArticles = await getAllAcademyArticles();
      const relatedArticles = allAcademyArticles
        .filter(
          (art: DocPost): boolean =>
            art.slug !== slug &&
            (art.tags ?? []).some(
              (tag: string): boolean => article.tags?.includes(tag) ?? false,
            ),
        )
        .slice(0, RELATED_DOCS_COUNT)
        .map((a: DocPost) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          description: a.description,
        }));

      article.relatedArticles = relatedArticles;
    }

    return article;
  } catch (e) {
    console.error('Error in getAcademyArticleBySlug', e);
    return undefined;
  }
}
