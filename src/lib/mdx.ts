import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { z } from 'zod';
import { BlogPost } from './types';

const matterDataSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  date: z.union([z.string(), z.date()]),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  author: z.string().optional(),
});

// Removing unused type definition

// Add utility function for consistent date handling
function normalizeDate(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

const postsDirectory = path.join(process.cwd(), 'src/app/content/blog');

export async function getAllPosts(): Promise<BlogPost[]> {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  console.time('readdirSync');
  const fileNames = fs.readdirSync(postsDirectory);
  console.timeEnd('readdirSync');
  const allPostsData = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const parsed = matter(fileContents);
        const data = matterDataSchema.parse(parsed.data);

        return {
          id: slug,
          slug: slug,
          title: data.title,
          description: data.description,
          date: normalizeDate(data.date),
          image: data.image || `/images/blog/${slug}.svg`,
          tags: data.tags || [],
          readingTime: data.readingTime || '5 min read',
          author: data.author || 'Wesley Quintero',
          content: '',
        } as BlogPost;
      }),
  );

  return allPostsData.sort((a: BlogPost, b: BlogPost) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
}

interface BlogPostData {
  id: string;
  title: string;
  tags?: string[];
}

export async function getPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    // If not, return sample data from data/portfolio-data/blog.json
    const blogData = await import('@/data/portfolio-data/blog.json');
    const post = blogData.posts.find((post: BlogPostData) => post.id === slug);

    if (!post) return undefined;

    // Get related posts
    const allPosts = blogData.posts;
    const relatedPosts = allPosts
      .filter(
        (p) => p.id !== slug && p.tags.some((tag) => post.tags.includes(tag)),
      )
      .slice(0, 2)
      .map((p) => ({
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
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const parsed = matter(fileContents);
    const data = matterDataSchema.parse(parsed.data);
    const { content } = parsed;

    // Get related posts
    const allPosts = await getAllPosts();
    const relatedPosts = allPosts
      .filter(
        (post: BlogPost) =>
          post.slug !== slug &&
          post.tags.some((tag: string) => data.tags?.includes(tag) ?? false),
      )
      .slice(0, 2);

    return {
      id: slug,
      slug,
      title: data.title,
      description: data.description,
      date: normalizeDate(data.date),
      image: data.image || `/images/blog/${slug}.svg`,
      tags: data.tags || [],
      readingTime: data.readingTime || '5 min read',
      author: data.author || 'Wesley Quintero',
      content,
      relatedPosts,
    };
  } catch {
    return undefined;
  }
}
