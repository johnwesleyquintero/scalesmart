import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const baseUrl = 'https://wescode.vercel.app';

// Static URLs to reduce bundle size and improve performance
const staticUrls: MetadataRoute.Sitemap = [
  {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'always',
    priority: 1.0,
  },
  {
    url: `${baseUrl}/admin`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
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
    url: `${baseUrl}/prompt-request-generator`,
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

// Pre-computed blog and doc URLs to avoid file system operations in serverless function
const blogUrls: MetadataRoute.Sitemap = [
  { url: `${baseUrl}/blog/proactive-specialist`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/b2b-strategies-amazon-sellers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/data-visualization-for-amazon-sellers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/ai-automation-for-amazon-sellers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/amazon-ppc-strategy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/building-systems-not-goals`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/technical-debt-management`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/scalable-architecture-patterns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${baseUrl}/blog/modern-development-workflows`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
];

const docUrls: MetadataRoute.Sitemap = [
  { url: `${baseUrl}/docs/getting-started`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${baseUrl}/docs/api-reference`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${baseUrl}/docs/deployment`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${baseUrl}/docs/configuration`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...staticUrls, ...blogUrls, ...docUrls];
}