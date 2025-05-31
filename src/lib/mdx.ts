import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { z } from 'zod';
import { BlogPost, DocPost } from '@/types';

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
 * @constant {string} DEFAULT_DOC_TITLE - Default title for document posts if not specified or derivable.
 */
const DEFAULT_DOC_TITLE = 'Untitled Document';
/**
 * @constant {string} INTRODUCTION_SLUG - Slug for the main introduction document.
 */
const INTRODUCTION_SLUG = 'introduction';
/**
 * @constant {string} INTRODUCTION_TITLE - Title for the main introduction document.
 */
const INTRODUCTION_TITLE = 'Introduction';

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
 * Zod schema for validating frontmatter data of documentation posts.
 * Title is optional as it can be derived from the slug.
 * @property {string} [title] - An optional title of the document. If not provided, it will be derived.
 * @property {string} [description=''] - An optional description of the document. Defaults to an empty string.
 * @property {string|Date} [date] - The publication date of the document. Can be a string or Date object.
 * @property {string} [image] - An optional URL or path to an image associated with the document.
 * @property {string[]} [tags] - An optional array of tags for the document.
 * @property {string} [readingTime] - An optional estimated reading time for the document.
 * @property {string} [author] - An optional author of the document.
 * @property {'doc'} [type='doc'] - The type of the post, defaulting to 'doc'.
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
  type: z.literal('doc').optional().default('doc'),
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
  'introduction.md'
];
/**
 * @constant {string} DOCS_BASE_DIR_NAME - The base name of the docs directory (e.g., "docs").
 */
const DOCS_BASE_DIR_NAME = path.basename(docsDirectory);
/**
 * @constant {string[]} MARKDOWN_FILE_EXTENSIONS - An array of supported Markdown file extensions.
 */
const MARKDOWN_FILE_EXTENSIONS = [EXT_MDX, EXT_MD];
/** A regular expression to match Markdown file extensions. */
const MARKDOWN_FILE_REGEX = new RegExp(`\\.(${STR_MDX}|${STR_MD})$`);
/**
 * @constant {number} RELATED_DOCS_COUNT - The number of related documents to fetch for a given document post.
 */
const RELATED_DOCS_COUNT = 2;

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

  /**
   * Determines the priority of a document file based on its name.
   * Lower numbers indicate higher priority.
   * @param fileName - The name of the file.
   * @returns The priority number.
   */
  function getFilePriority(fileName: string): number {
    const priority = DOC_FILE_PRIORITY_ORDER.indexOf(fileName);
    return priority === -1 ? DOC_FILE_PRIORITY_ORDER.length : priority; // Lower index = higher priority
  }

  /**
   * Recursively reads all MDX/MD files from a given directory and its subdirectories.
   * @param directory - The directory to scan.
   */
  function readDocsRecursively(directory: string) {
    if (!fs.existsSync(directory)) {
      return;
    }
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        readDocsRecursively(fullPath);
      } else if (MARKDOWN_FILE_EXTENSIONS.some((ext) => file.endsWith(ext))) {
        docFiles.push(fullPath);
      }
    }
  }

  readDocsRecursively(docsDirectory);

  const processedDocs: { [slug: string]: DocPost } = {};

  for (const fullPath of docFiles) {
    const docPost = await processDocFile(fullPath);
    if (docPost) {
      const { slug, fileName } = docPost;
      const currentFilePriority = getFilePriority(fileName!);
      const existingDoc = processedDocs[slug];

      if (existingDoc) {
        const existingFilePriority = getFilePriority(existingDoc.fileName!);
        if (currentFilePriority < existingFilePriority) {
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
 * Derives the slug for a documentation post based on its relative path.
 * Special handling for 'introduction' slug for root-level special files.
 * @param relativePath - The path of the file relative to the docs directory.
 * @param fileName - The name of the file (unused in new logic but kept for signature consistency).
 * @param parentDir - The name of the parent directory of the file (unused in new logic but kept for signature consistency).
 * @returns The derived slug string.
 */
function deriveDocSlug(
  relativePath: string,
  _fileName: string,
  parentDir: string,
): string {
  const normalizedRelativePath = relativePath.replace(/\\/g, '/');

  // Check for special files directly under the `docsDirectory` that should map to 'introduction'
  const isRootSpecialFile = DOC_FILE_NAMES.some(name => name.replace(/\\/g, '/') === normalizedRelativePath);
  const isParentDocsBaseDir = parentDir === DOCS_BASE_DIR_NAME;

  if (isRootSpecialFile && isParentDocsBaseDir) {
    return INTRODUCTION_SLUG;
  }

  // For all other cases, return the full relative path as the slug, removing extension
  return normalizedRelativePath.replace(MARKDOWN_FILE_REGEX, '');
}


/**
 * Derives the title for a documentation post.
 * Uses the frontmatter title if available.
 * Otherwise, uses a predefined title for 'introduction' slug,
 * or generates a title from the slug by capitalizing words.
 * Defaults to 'Untitled Document' if no other title can be determined.
 * @param slug - The slug of the document.
 * @param frontmatterTitle - The title from the document's frontmatter, if any.
 * @returns The derived title string.
 */
function deriveDocTitle(slug: string, frontmatterTitle?: string): string {
  if (frontmatterTitle) {
    return frontmatterTitle;
  }
  if (slug === INTRODUCTION_SLUG) {
    return INTRODUCTION_TITLE;
  }
  return (
    slug
      .split('/')
      .pop()
      ?.replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || DEFAULT_DOC_TITLE
  );
}

/**
 * Processes a single documentation file (MDX or MD).
 * Reads the file, parses frontmatter, validates it, and constructs a DocPost object.
 * @param fullPath - The absolute path to the documentation file.
 * @returns A promise that resolves to a DocPost object, or null if processing fails.
 */
async function processDocFile(fullPath: string): Promise<DocPost | null> {
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(fullPath, UTF8);
  } catch (err) {
    console.error(`ERROR: Could not read file ${fullPath}:`, err);
    return null;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(fileContents);
  } catch (err) {
    console.error(`ERROR: Could not parse frontmatter in ${fullPath}:`, err);
    return null;
  }

  let docFrontmatter: z.infer<typeof docMatterDataSchema>;
  try {
    docFrontmatter = docMatterDataSchema.parse(parsed.data);
  } catch (error) {
    console.warn(
      `Frontmatter validation error in ${fullPath}. Using defaults. Error:`,
      error,
    );
    // Provide a minimal default structure if parse fails completely
    docFrontmatter = {
      title: undefined,
      description: EMPTY_STRING,
      date: undefined,
      image: undefined,
      tags: [],
      readingTime: undefined,
      author: undefined,
      type: 'doc',
    };
  }

  const relativePath = path.relative(docsDirectory, fullPath);
  const fileName = path.basename(fullPath);
  const parentDir = path.basename(path.dirname(fullPath));

  const currentSlug = deriveDocSlug(relativePath, fileName, parentDir);
  const currentTitle = deriveDocTitle(currentSlug, docFrontmatter.title);

  return {
    id: currentSlug,
    slug: currentSlug,
    title: currentTitle,
    description: docFrontmatter.description,
    date: normalizeDate(docFrontmatter.date || new Date()),
    image: docFrontmatter.image || `/images/docs/${currentSlug}.svg`,
    tags: docFrontmatter.tags || [],
    readingTime: docFrontmatter.readingTime || DEFAULT_READING_TIME,
    author: docFrontmatter.author || DEFAULT_AUTHOR,
    type: docFrontmatter.type || 'doc',
    content: parsed.content,
    fileName: fileName, // Add fileName to the returned object for prioritization logic
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
 * Finds the actual file path for a given documentation slug.
 * Handles special cases like 'introduction' and checks for .mdx and .md files
 * directly under the slug name or within a directory named after the slug (looking for special filenames).
 * @param slug - The slug of the document to find.
 * @returns The full path to the document file if found, otherwise undefined.
 */
function findDocFile(slug: string): string | undefined {
  // Special handling for the root 'introduction' slug
  if (slug === INTRODUCTION_SLUG) {
    for (const fileName of DOC_FILE_NAMES) {
      const filePath = path.join(docsDirectory, fileName);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }

  // Try to find the file directly (e.g., 'getting-started.mdx' or 'amazon-seller-tools/documentation.mdx')
  const directPathMdx = path.join(docsDirectory, `${slug}${EXT_MDX}`);
  const directPathMd = path.join(docsDirectory, `${slug}${EXT_MD}`);

  if (fs.existsSync(directPathMdx)) {
    return directPathMdx;
  }
  if (fs.existsSync(directPathMd)) {
    return directPathMd;
  }

  // If not found directly, try to find it as a directory's main doc (e.g., 'amazon-seller-tools/index.md')
  const dirPath = path.join(docsDirectory, slug);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    for (const fileName of DOC_FILE_NAMES) {
      const filePath = path.join(dirPath, fileName);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
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
  const fullPath = findDocFile(slug);

  if (!fullPath) {
    return undefined;
  }

  try {
    let fileContents: string;
    try {
      fileContents = fs.readFileSync(fullPath, UTF8);
    } catch (err) {
      console.error(`ERROR: Could not read doc file ${fullPath}:`, err);
      return undefined;
    }

    const parsed = matter(fileContents);
    const { content } = parsed;
    let docFrontmatter: z.infer<typeof docMatterDataSchema>;

    try {
      docFrontmatter = docMatterDataSchema.parse(parsed.data);
    } catch (error) {
      console.warn(
        `Frontmatter validation Error in ${fullPath}. Using defaults. Error:`,
        error,
      );
      docFrontmatter = {
        title: undefined,
        description: EMPTY_STRING,
        date: undefined,
        image: undefined,
        tags: [],
        readingTime: undefined,
        author: undefined,
        type: 'doc',
      };
    }

    const finalTitle = deriveDocTitle(slug, docFrontmatter.title);

    const allDocs = await getAllDocPosts();
    const relatedDocs = allDocs
      .filter(
        (doc: DocPost): boolean =>
          doc.slug !== slug &&
          (doc.tags ?? []).some(
            (tag: string): boolean =>
              docFrontmatter.tags?.includes(tag) ?? false,
          ),
      )
      .slice(0, 2)
      .map((d: DocPost) => ({
        id: d.id,
        slug: d.slug,
        title: d.title,
        description: d.description,
      }));

    return {
      id: slug,
      slug,
      title: finalTitle,
      description: docFrontmatter.description,
      date: normalizeDate(docFrontmatter.date || new Date()),
      image: docFrontmatter.image || `/images/docs/${slug}.svg`,
      tags: docFrontmatter.tags || [],
      readingTime: docFrontmatter.readingTime || DEFAULT_READING_TIME,
      author: docFrontmatter.author || DEFAULT_AUTHOR,
      type: docFrontmatter.type || 'doc',
      content,
      relatedDocs,
      fileName: path.basename(fullPath),
    };
  } catch (e) {
    console.error('Error in getDocPostBySlug', e);
    return undefined;
  }
}
