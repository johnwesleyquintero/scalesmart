import { generateSampleCsv } from './generate-sample-csv';
import { getAllBlogPosts } from './mdx';
import { BlogPost, CaseStudy, StaticDataTypes } from './static-data-types';

export async function loadStaticData<T extends keyof StaticDataTypes>(
  file: T,
): Promise<StaticDataTypes[T]> {
  if (file === 'blog') {
    const posts = await getAllBlogPosts();
    return posts as unknown as StaticDataTypes[T];
  }

  if (file === 'case-studies') {
    const data = await import('../data/portfolio-data/case-studies.json');
    return data.default.studies.map((study: CaseStudy) => {
      const { id, title, description, metrics, competitorData, date, tags } =
        study;
      const mappedStudy: CaseStudy = {
        id,
        title,
        description,
        metrics: metrics.map(
          (metric: {
            name: string;
            value: number;
            change: number;
            trend: string;
          }) => ({
            ...metric,
            trend:
              metric.trend === 'up'
                ? 'up'
                : metric.trend === 'down'
                  ? 'down'
                  : 'neutral',
          }),
        ),
        competitorData,
        date,
        tags,
      };
      return mappedStudy;
    }) as unknown as StaticDataTypes[T];
  }

  if (file === 'acos') {
    // Remove unsafe type assertion
    const csv = generateSampleCsv('acos');
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map((line) => {
      const values = line.split(',');
      return {
        productName:
          values[headers.indexOf('productName')]?.replace(/(^"|"$)/g, '') || '',
        campaign:
          values[headers.indexOf('campaign')]?.replace(/(^"|"$)/g, '') || '',
        adSpend: parseFloat(values[headers.indexOf('adSpend')] || '0') || 0,
        sales: parseFloat(values[headers.indexOf('sales')] || '0') || 0,
        clicks: parseInt(values[headers.indexOf('clicks')] || '0', 10) || 0,
        impressions:
          parseInt(values[headers.indexOf('impressions')] || '0', 10) || 0,
      };
    });

    return data as unknown as StaticDataTypes[T];
  }

  throw new Error(`Invalid file type: ${file}`);
}
