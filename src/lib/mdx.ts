import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { z } from 'zod';
import { BlogPost, DocPost } from '@/types'; // Assuming BlogPost, DocPost types are compatible or can be extended for AcademyArticle
import {
  DEFAULT_DOC_TITLE,
  INTRODUCTION_SLUG,
  INTRODUCTION_TITLE,
  RELATED_DOCS_COUNT,
} from '@/config/docs';

/**
 * @constant {string} EMPTY_STRING - An empty string constant.
 */
const EMPTY_STRING = '';
/**
 * @constant {string} DEFAULT_READING_TIME - Default reading time for posts if not specified.
 */
const DEFAULT_READING_TIME = '5 min read';
/**
 * @constant {string} DEFAULT_AUTHOR - Default author for posts if not specified.
 */
const DEFAULT_AUTHOR = 'Wesley Quintero';

/**
 * @constant {string} STR_MDX - String constant for 'mdx'.
 */
const STR_MDX = 'mdx';
/**
 * @constant {string} STR_MD - String constant for 'md'.
 */
const STR_MD = 'md';
/**
 * @constant {string} EXT_MDX - File extension for MDX files.
 */
const EXT_MDX = `.${STR_MDX}`;
/**
 * @constant {string} EXT_MD - File extension for Markdown files.
 */
const EXT_MD = `.${STR_MD}`;
/**
 * @constant {string} UTF8 - Encoding constant for file system operations.
 */
const UTF8 = 'utf8';

/**
 * Zod schema for validating frontmatter data of blog posts.
 * @property {string} title - The title of the blog post.
 * @property {string} [description=''] - An optional description of the blog post. Defaults to an empty string.
 * @property {string|Date} [date] - The publication date of the blog post. Can be a string or Date object.
 * @property {string} [image] - An optional URL or path to an image associated with the blog post.
 * @property {string[]} [tags] - An optional array of tags for the blog post.
 * @property {string} [readingTime] - An optional estimated reading time for the blog post.
 * @property {string} [author] - An optional author of the blog post.
 * @property {'blog'|'article'|'case-study'} [type='blog'] - The type of the post, defaulting to 'blog'.
 */
const blogMatterDataSchema = z.object({
  /** The title of the blog post. */
  title: z.string(),
  /** An optional description of the blog post. Defaults to an empty string. */
  description: z.string().optional().default(EMPTY_STRING),
  /** The publication date of the blog post. Can be a string or Date object. */
  date: z.union([z.string(), z.date()]).optional(),
  /** An optional URL or path to an image associated with the blog post. */
  image: z.string().optional(),
  /** An optional array of tags for the blog post. */
  tags: z.array(z.string()).optional(),
  /** An optional estimated reading time for the blog post. */
  readingTime: z.string().optional(),
  /** An optional author of the blog post. */
  author: z.string().optional(),
  /** The type of the post, defaulting to 'blog'. */
  type: z.enum(['blog', 'article', 'case-study']).optional().default('blog'),
});

/**
 * Zod schema for validating frontmatter data of documentation posts and academy articles.
 * Title is optional as it can be derived from the slug.
 * @property {string} [title] - An optional title of the document. If not provided, it will be derived.
 * @property {string} [description=''] - An optional description of the document. Defaults to an empty string.
 * @property {string|Date} [date] - The publication date of the document. Can be a string or Date object.
 * @property {string} [image] - An optional URL or path to an image associated with the document.
 * @property {string[]} [tags] - An optional array of tags for the document.
 * @property {string} [readingTime] - An optional estimated reading time for the document.
 * @property {string} [author] - An optional author of the document.
 * @property {'doc' | 'academy'} [type='doc'] - The type of the post, defaulting to 'doc' or 'academy'.
 */
const docMatterDataSchema = z.object({
  /** An optional title of the document. If not provided, it will be derived. */
  title: z.string().optional(), // Make title optional here, as we'll derive it if missing
  /** An optional description of the document. Defaults to an empty string. */
  description: z.string().optional().default(EMPTY_STRING),
  /** The publication date of the document. Can be a string or Date object. */
  date: z.union([z.string(), z.date()]).optional(),
  /** An optional URL or path to an image associated with the document. */
  image: z.string().optional(),
  /** An optional array of tags for the document. */
  tags: z.array(z.string()).optional(),
  /** An optional estimated reading time for the document. */
  readingTime: z.string().optional(),
  /** An optional author of the document. */
  author: z.string().optional(),
  /** The type of the post, defaulting to 'doc'. */
  type: z.enum(['doc', 'academy']).optional().default('doc'),
});

/**
 * Normalizes a date string or Date object to 'YYYY-MM-DD' format.
 * @param date - The date to normalize.
 * @returns The normalized date string.
 */
function normalizeDate(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * @constant {string[]} DOC_FILE_PRIORITY_ORDER - Defines the priority order for special document filenames.
 * Files appearing earlier in this list have higher priority for a given slug.
 * For example, `index.mdx` will be chosen over `README.mdx` if both exist for the same logical document.
 */
const DOC_FILE_PRIORITY_ORDER = [
  `index.${STR_MDX}`,
  `README.${STR_MDX}`,
  `documentation.${STR_MDX}`,
  `index.${STR_MD}`,
  `README.${STR_MD}`,
  `documentation.${STR_MD}`,
];
/**
 * @constant {string} blogPostsDirectory - Path to the directory containing blog post content.
 */
const blogPostsDirectory = path.join(process.cwd(), 'src/app/content/blog');
/**
 * @constant {string} docsDirectory - Path to the directory containing documentation content.
 */
const docsDirectory = path.join(process.cwd(), 'src/app/content/docs');
/**
 * @constant {string} academyArticlesDirectory - Path to the directory containing academy article content.
 */
const academyArticlesDirectory = path.join(
  process.cwd(),
  'src/app/content/academy',
);

/**
 * @constant {string[]} DOC_FILE_NAMES - A list of special filenames that are typically used for index or main documentation pages within a directory.
 */
const DOC_FILE_NAMES = [
  'documentation.md',
  'index.mdx',
  'README.mdx',
  'index.md',
  'README.md',
  // Added introduction.mdx as a special root-level file that maps to 'introduction' slug
  'introduction.mdx',
  'introduction.md',
];
/**
 * @constant {string} DOCS_BASE_DIR_NAME - The base name of the docs directory (e.g., "docs").
 */
const DOCS_BASE_DIR_NAME = path.basename(docsDirectory);
/**
 * @constant {string} ACADEMY_BASE_DIR_NAME - The base name of the academy directory (e.g., "academy").
 */
const ACADEMY_BASE_DIR_NAME = path.basename(academyArticlesDirectory);

/**
 * @constant {string[]} MARKDOWN_FILE_EXTENSIONS - An array of supported Markdown file extensions.
 */
const MARKDOWN_FILE_EXTENSIONS = [EXT_MDX, EXT_MD];
/** A regular expression to match Markdown file extensions. */
const MARKDOWN_FILE_REGEX = new RegExp(`\\.(${STR_MDX}|${STR_MD})$`);

/**
 * Recursively reads all MDX/MD files from a given directory and its subdirectories.
 * @param directory - The directory to scan.
 * @param fileList - An array to accumulate the full paths of found files.
 */
function readFilesRecursively(directory: string, fileList: string[]) {
  if (!fs.existsSync(directory)) {
    return;
  }
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      readFilesRecursively(fullPath, fileList);
    } else if (MARKDOWN_FILE_EXTENSIONS.some((ext) => file.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }
}

/**
 * Retrieves all blog posts from the filesystem.
 * Parses frontmatter and sorts posts by date in descending order.
 * @returns A promise that resolves to an array of BlogPost objects.
 */
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

/**
 * Retrieves all documentation posts from the filesystem.
 * Recursively scans the docs directory, processes MDX/MD files,
 * handles filename prioritization (e.g., index.mdx over README.md),
 * and sorts posts by date in descending order.
 * @returns A promise that resolves to an array of DocPost objects.
 */
export async function getAllDocPosts(): Promise<DocPost[]> {
  const docFiles: string[] = [];
  readFilesRecursively(docsDirectory, docFiles);

  const processedDocs: { [slug: string]: DocPost } = {};

  for (const fullPath of docFiles) {
    const docPost = await processContentFile(fullPath, 'doc');
    if (docPost) {
      const { slug, fileName } = docPost;
      const currentFilePriority = DOC_FILE_PRIORITY_ORDER.indexOf(fileName!);
      const existingDoc = processedDocs[slug];

      if (existingDoc) {
        const existingFilePriority = DOC_FILE_PRIORITY_ORDER.indexOf(
          existingDoc.fileName!,
        );
        if (
          currentFilePriority !== -1 &&
          (existingFilePriority === -1 ||
            currentFilePriority < existingFilePriority)
        ) {
          processedDocs[slug] = docPost;
        }
      } else {
        processedDocs[slug] = docPost;
      }
    }
  }
  const allDocsData = Object.values(processedDocs).sort(
    (a: DocPost, b: DocPost) =>
      normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );

  return allDocsData;
}

/**
 * Retrieves all academy articles from the filesystem.
 * This function mimics `getAllDocPosts` but specifically targets the academy content directory.
 * @returns A promise that resolves to an array of DocPost objects (AcademyArticle equivalent).
 */
export async function getAllAcademyArticles(): Promise<DocPost[]> {
  // Using DocPost type for now, can be specific if needed
  const academyFiles: string[] = [];
  readFilesRecursively(academyArticlesDirectory, academyFiles);

  const processedArticles: { [slug: string]: DocPost } = {}; // Using DocPost as placeholder for AcademyArticle type

  for (const fullPath of academyFiles) {
    const article = await processContentFile(fullPath, 'academy'); // Process as academy type
    if (article) {
      processedArticles[article.slug] = article;
    }
  }

  const allAcademyArticlesData = Object.values(processedArticles).sort(
    (a: DocPost, b: DocPost) =>
      normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );

  return allAcademyArticlesData;
}

/**
 * Derives the slug for a content post (documentation or academy) based on its full path and content type.
 * Handles special cases like 'introduction' and cleans up generic file names in slugs.
 * @param fullPath - The absolute path to the content file.
 * @param baseDir - The base directory (e.g., docsDirectory, academyArticlesDirectory).
 * @param fileType - The type of content ('doc' or 'academy').
 * @returns The derived slug string.
 */
function deriveContentSlug(
  fullPath: string,
  baseDir: string,
  fileType: 'doc' | 'academy',
): string {
  let relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/'); // Normalize path separators

  // Special handling for 'introduction' slug within the docs directory
  if (
    fileType === 'doc' &&
    path.basename(fullPath).toLowerCase().startsWith('introduction') &&
    path.dirname(relativePath) === '.'
  ) {
    return INTRODUCTION_SLUG;
  }

  // Remove file extension
  let slug = relativePath.replace(MARKDOWN_FILE_REGEX, '');

  // If the last segment is a common file name (like 'documentation', 'index', 'readme'), remove it.
  const parts = slug.split('/');
  const lastPart = parts[parts.length - 1]?.toLowerCase();

  if (
    DOC_FILE_NAMES.some(
      (name) => lastPart === name.replace(MARKDOWN_FILE_REGEX, ''),
    )
  ) {
    // Only remove if it's not the only segment (e.g., 'documentation.mdx' should still be 'documentation' not empty string)
    if (parts.length > 1) {
      slug = parts.slice(0, -1).join('/');
    }
  }

  return slug;
}

/**
 * Derives the title for a content post.
 * Uses the frontmatter title if available.
 * Otherwise, uses a predefined title for 'introduction' slug,
 * or generates a title from the slug by capitalizing words.
 * Defaults to 'Untitled Document' or 'Untitled Academy Article' if no other title can be determined.
 * @param slug - The slug of the content.
 * @param frontmatterTitle - The title from the content's frontmatter, if any.
 * @param fileType - The type of content ('doc' or 'academy').
 * @returns The derived title string.
 */
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

  const defaultTitle =
    fileType === 'academy' ? 'Untitled Academy Article' : DEFAULT_DOC_TITLE;

  // Split by '/' to get the last segment, then by '-' for words, capitalize, and join
  const titleFromSlug =
    slug
      .split('/')
      .pop() // Get the last part of the slug (e.g., "nested-slug-example" from "category/nested-slug-example")
      ?.replace(/-/g, ' ') // Replace hyphens with spaces
      .split(' ') // Split into words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(' ') || defaultTitle;

  return titleFromSlug;
}

/**
 * Processes a single documentation or academy file (MDX or MD).
 * Reads the file, parses frontmatter, validates it, and constructs a DocPost object.
 * @param fullPath - The absolute path to the content file.
 * @param fileType - The type of content being processed ('doc' or 'academy').
 * @returns A promise that resolves to a DocPost object, or undefined if processing fails.
 */
async function processContentFile(
  fullPath: string,
  fileType: 'doc' | 'academy',
): Promise<DocPost | undefined> {
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(fullPath, UTF8);
  } catch (err) {
    console.error(`ERROR: Could not read file ${fullPath}:`, err);
    return undefined; // Changed from null to undefined
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(fileContents);
  } catch (err) {
    console.error(`ERROR: Could not parse frontmatter in ${fullPath}:`, err);
    return undefined; // Changed from null to undefined
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
    };
  }

  const baseDir = fileType === 'doc' ? docsDirectory : academyArticlesDirectory;
  const currentSlug = deriveContentSlug(fullPath, baseDir, fileType); // Pass fullPath and baseDir

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
  } as DocPost;
}

/**
 * Interface for basic content data, used for finding related posts.
 * @property id - Unique identifier of the content.
 * @property title - Title of the content.
 * @property description - Description of the content.
 * @property slug - Slug of the content.
 * @property tags - Optional array of tags associated with the content.
 */
interface ContentData {
  id: string;
  title: string;
  description: string;
  slug: string;
  tags?: string[];
}

/**
 * Retrieves a single blog post by its slug.
 * It first checks if the blog posts directory exists. If not, it attempts to load data from a static JSON file.
 * It also finds and attaches related blog posts based on common tags.
 * @param slug - The slug of the blog post to retrieve.
 * @returns A promise that resolves to a BlogPost object if found, otherwise undefined.
 */
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

/**
 * Finds the actual file path for a given content slug within a base directory.
 * @param slug - The slug of the content to find.
 * @param baseDir - The base directory to search within (e.g., docsDirectory, academyArticlesDirectory).
 * @param fileType - The type of content ('doc' or 'academy') for specific root-level handling.
 * @returns The full path to the content file if found, otherwise undefined.
 */
function findContentFile(
  slug: string,
  baseDir: string,
  fileType: 'doc' | 'academy',
): string | undefined {
  // Check for special handling for root-level 'introduction' for docs
  if (slug === INTRODUCTION_SLUG && fileType === 'doc') {
    for (const fileName of DOC_FILE_NAMES) {
      const filePath = path.join(baseDir, fileName);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }

  // Determine potential file paths
  const potentialPaths: string[] = [];

  // 1. Direct file path: <baseDir>/<slug>.<ext>
  for (const ext of MARKDOWN_FILE_EXTENSIONS) {
    potentialPaths.push(path.join(baseDir, `${slug}${ext}`));
  }

  // 2. Directory's main file: <baseDir>/<slug>/<special-file-name>.<ext>
  // This handles cases like /docs/api/chat mapping to src/app/content/docs/api/chat/documentation.mdx
  const dirPathForSlug = path.join(baseDir, slug);
  if (
    fs.existsSync(dirPathForSlug) &&
    fs.statSync(dirPathForSlug).isDirectory()
  ) {
    for (const specialFileName of DOC_FILE_NAMES) {
      potentialPaths.push(path.join(dirPathForSlug, specialFileName));
    }
  }

  // Find the first existing file among potential paths
  for (const filePath of potentialPaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return undefined;
}

/**
 * Retrieves a single documentation post by its slug.
 * It finds the appropriate file path, parses its frontmatter, and constructs a DocPost object.
 * It also determines related documentation posts based on common tags.
 * @param slug - The slug of the documentation post to retrieve.
 * @returns A promise that resolves to a DocPost object if found, otherwise undefined.
 */
export async function getDocPostBySlug(
  slug: string,
): Promise<DocPost | undefined> {
  const fullPath = findContentFile(slug, docsDirectory, 'doc');

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

/**
 * Retrieves a single academy article by its slug.
 * It finds the appropriate file path, parses its frontmatter, and constructs a DocPost object (AcademyArticle equivalent).
 * @param slug - The slug of the academy article to retrieve.
 * @returns A promise that resolves to a DocPost object if found, otherwise undefined.
 */
export async function getAcademyArticleBySlug(
  slug: string,
): Promise<DocPost | undefined> {
  // Using DocPost type for now
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
        .slice(0, RELATED_DOCS_COUNT) // Use RELATED_DOCS_COUNT constant
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
