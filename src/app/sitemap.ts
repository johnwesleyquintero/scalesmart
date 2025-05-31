import { MetadataRoute } from 'next';
import path from 'path';
import { promises as fs } from 'fs';

export const dynamic = 'force-static';

const baseUrl = 'https://wescode.vercel.app';

async function getMdxContentUrls(
  contentDir: string,
  routePrefix: string,
): Promise<MetadataRoute.Sitemap> {
  const contentPath = path.join(process.cwd(), contentDir);
  let slugs: { slug: string; lastModified: Date }[] = [];

  try {
    const files = await fs.readdir(contentPath, { recursive: true });
    for (const file of files) {
      if (file.endsWith('.mdx')) {
        const filePath = path.join(contentPath, file);
        const stats = await fs.stat(filePath);
        const lastModified = stats.mtime;

        let slug = file.replace(/\.mdx$/, '');

        if (
          slug.toLowerCase().endsWith('readme') &&
          file.toLowerCase().endsWith('readme.mdx')
        ) {
          slug = slug.replace(/readme$/i, '');
        }

        slug = slug.split(path.sep).join('/');

        const parts = slug.split('/');
        if (
          parts.length > 0 &&
          parts[parts.length - 1].toLowerCase() === 'documentation'
        ) {
          slug = parts.slice(0, -1).join('/');
        }

        if (slug) {
          slugs.push({ slug, lastModified });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read content directory ${contentDir}:`, error);
  }

  return slugs.map((item) => ({
    url: `${baseUrl}${routePrefix}/${item.slug}`.replace(/\/+/g, '/'),
    lastModified: item.lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/academy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/amazon-seller-tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ats`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/crm`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/project-management`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/workflow-builder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const blogUrls = await getMdxContentUrls('src/app/content/blog', '/blog');
  const academyUrls = await getMdxContentUrls(
    'src/app/content/academy',
    '/academy',
  );
  const docUrls = await getMdxContentUrls('src/app/content/docs', '/docs');

  return [...staticUrls, ...blogUrls, ...academyUrls, ...docUrls];
}
