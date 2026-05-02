import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const baseUrl = 'https://scalesmart.vercel.app';

// Static URLs to reduce bundle size and improve performance
const staticUrls: MetadataRoute.Sitemap = [
  {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'always',
    priority: 1.0,
  },
  {
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/faq`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${baseUrl}/services`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/services/brand-support`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/services/operations-growth`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/services/workforce-workflows`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/pricing`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/careers`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  {
    url: `${baseUrl}/privacy-policy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  },
  {
    url: `${baseUrl}/terms-of-service`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  },
  {
    url: `${baseUrl}/prompt-request-generator`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
];

// Pre-computed blog URLs to avoid file system operations in serverless function
const blogUrls: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/blog/10-advanced-amazon-seo-techniques-that-actually-work-in-2025`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/b2b-strategies-amazon-sellers`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/data-visualization-for-amazon-sellers`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/excel-power-tools-amazon-sellers`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/flat-file`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/getting-started-with-amazon-fba`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/mastering-amazon-ppc`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/proactive-specialist`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/blog/project-board`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...staticUrls, ...blogUrls];
}
