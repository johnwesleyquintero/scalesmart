import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { z } from 'zod';
import { BlogPost, DocPost } from '@/types';

const DEFAULT_READING_TIME = '5 min read';
const DEFAULT_AUTHOR = 'Wesley Quintero';

const blogMatterDataSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  date: z.union([z.string(), z.date()]).optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  author: z.string().optional(),
  type: z.enum(['blog', 'article', 'case-study']).optional().default('blog'),
});

const docMatterDataSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  date: z.union([z.string(), z.date()]).optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  author: z.string().optional(),
  type: z.literal('doc').optional().default('doc'),
});

function normalizeDate(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

const blogPostsDirectory = path.join(process.cwd(), 'src/app/content/blog');
const docsDirectory = path.join(process.cwd(), 'src/app/content/docs');

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(blogPostsDirectory)) {
    return [];
  }
  const fileNames = fs.readdirSync(blogPostsDirectory);
  const allPostsData = await Promise.all(
    fileNames
      .filter(
        (fileName): boolean =>
          fileName.endsWith('.mdx') || fileName.endsWith('.md'),
      )
      .map((fileName) => {
        const slug = fileName.replace(/\.(mdx|md)$/, '');
        const fullPath = path.join(blogPostsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
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
          content: '',
        } as BlogPost;
      }),
  );

  return allPostsData.sort((a: BlogPost, b: BlogPost) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
}

export async function getAllDocPosts(): Promise<DocPost[]> {
  const docFiles: string[] = [];

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
      } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
        docFiles.push(fullPath);
      }
    }
  }

  readDocsRecursively(docsDirectory);

  const docPromises = docFiles.map(async (fullPath) => {
    console.log(`DEBUG: Processing doc file: ${fullPath}`); // Log before file read
    let fileContents: string;
    try {
      fileContents = fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
      console.error(`ERROR: Could not read file ${fullPath}:`, err);
      return null; // Skip this file if read fails
    }

    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(fileContents);
    } catch (err) {
      console.error(`ERROR: Could not parse frontmatter in ${fullPath}:`, err);
      return null; // Skip this file if parsing fails
    }
    const relativePath = path.relative(docsDirectory, fullPath);
    const slug = relativePath.replace(/\.(mdx|md)$/, '');

    // Log the file being processed before parsing its data
    console.log(`Attempting to parse data for file: ${fullPath}`);

    let data: z.infer<typeof docMatterDataSchema> | undefined;
    try {
      data = docMatterDataSchema.parse(parsed.data);
    } catch (error) {
      console.error(`Validation Error in ${fullPath}:`, error);
      // Optionally, log the parsed.data to see what's missing
      console.log('Parsed data:', parsed.data);
      data = undefined;
    }

    if (!data) {
      // If data parsing failed, return null early
      return null;
    }

    const title = data.title;

    return {
      id: slug, // Will be replaced by actual slug later
      slug: slug, // Will be replaced by actual slug later
      title: title,
      description: data?.description || '',
      date: normalizeDate(data?.date || new Date()),
      image: data?.image || `/images/docs/${slug}.svg`, // Assuming slug is available or will be passed
      tags: data?.tags || [],
      readingTime: data?.readingTime || DEFAULT_READING_TIME,
      author: data?.author || DEFAULT_AUTHOR,
      type: data?.type,
      content: parsed.content,
    } as DocPost;
  });

  const allDocsData = (await Promise.all(docPromises)).filter(
    (doc): doc is DocPost => doc !== null,
  );

  return allDocsData.sort((a: DocPost, b: DocPost) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
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
    const fileContents = fs.readFileSync(fullPath, 'utf8');
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
  } catch {
    return undefined;
  }
}

export async function getDocPostBySlug(
  slug: string,
): Promise<DocPost | undefined> {
  let fullPath: string | undefined;

  function findDocRecursively(
    directory: string,
    slug: string,
  ): string | undefined {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const foundPath = findDocRecursively(filePath, slug);
        if (foundPath) {
          return foundPath;
        }
      } else if (file === `${slug}.mdx` || file === `${slug}.md`) {
        return filePath;
      } else if (
        slug.indexOf('/') === -1 &&
        (file === 'README.mdx' || file === 'README.md') &&
        path.basename(directory) === slug
      ) {
        return filePath;
      }
    }
    return undefined;
  }

  fullPath = findDocRecursively(docsDirectory, slug);

  if (!fullPath) {
    return undefined;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const parsed = matter(fileContents);
    let data: z.infer<typeof docMatterDataSchema> | undefined;
    let title = 'Untitled Document';
    try {
      data = docMatterDataSchema.parse(parsed.data) as z.infer<
        typeof docMatterDataSchema
      >;
      title = data.title;
    } catch (error) {
      console.error(`Validation Error in ${fullPath}:`, error);
      // Optionally, log the parsed.data to see what's missing
      console.log('Parsed data:', parsed.data);
    }
    const { content } = parsed;

    const allDocs = await getAllDocPosts();
    const relatedDocs = allDocs
      .filter(
        (doc: DocPost): boolean =>
          doc.slug !== slug &&
          (doc.tags ?? []).some(
            (tag: string): boolean => data?.tags?.includes(tag) ?? false,
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
      title,
      description: data?.description ?? '',
      date: normalizeDate(data?.date ?? new Date()),
      image: data?.image ?? `/images/docs/${slug}.svg`,
      tags: data?.tags ?? [],
      readingTime: data?.readingTime ?? DEFAULT_READING_TIME,
      author: data?.author ?? DEFAULT_AUTHOR,
      type: data?.type,
      content,
      relatedDocs,
    };
  } catch (e) {
    console.error('Error in getDocPostBySlug', e);
    return undefined;
  }
}
