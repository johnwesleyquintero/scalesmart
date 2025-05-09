import { generateSampleCsv } from './generate-sample-csv';
import { StaticDataTypes } from './static-data-types';

// Ensure 'acos' is a valid key in StaticDataTypes
type AcosDataType = Extract<keyof StaticDataTypes, 'acos'>;

export async function loadStaticData<T extends keyof StaticDataTypes>(
  file: T,
): Promise<StaticDataTypes[T]> {
  function validateStaticData(data: unknown): data is StaticDataTypes[T] {
    if (!Array.isArray(data)) return false;
    return data.every((item) => {
      const baseProps = 'id' in item && 'title' in item;
      switch (file) {
        case 'case-studies':
          return baseProps && 'metrics' in item;
        case 'blog':
          return baseProps && 'content' in item;
        default:
          return baseProps;
      }
    });
  }
  if (file === 'projects') {
    return (await import('../data/portfolio-data/projects.json')).default
      .projects as unknown as StaticDataTypes[T];
  }
  if (file === 'blog') {
    const data = await import('../data/portfolio-data/blog.json');
    return data.default.posts.map((post) => ({
      ...post,
      content: post.content || '',
      relatedPosts: post.relatedPosts || [],
    })) as unknown as StaticDataTypes[T];
  }
  if (file === 'case-studies') {
    const data = await import('../data/portfolio-data/case-studies.json');
    return data.default.studies as unknown as StaticDataTypes[T];
  }
  if (file === 'changelog') {
    return (await import('../data/portfolio-data/changelog.json')).default
      .changes as StaticDataTypes[T];
  }
  if (file === 'experience') {
    return (await import('../data/portfolio-data/experience.json')).default
      .experience as StaticDataTypes[T];
  }
  if (file === 'tools') {
    return (await import('../data/portfolio-data/tools.json')).default
      .tools as StaticDataTypes[T];
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
          values[headers.indexOf('productName')]?.replace(/(^\"|\"$)/g, '') ||
          '',
        campaign:
          values[headers.indexOf('campaign')]?.replace(/(^\"|\"$)/g, '') || '',
        adSpend: parseFloat(values[headers.indexOf('adSpend')] || '0') || 0,
        sales: parseFloat(values[headers.indexOf('sales')] || '0') || 0,
        clicks: parseInt(values[headers.indexOf('clicks')] || '0', 10) || 0,
        impressions:
          parseInt(values[headers.indexOf('impressions')] || '0', 10) || 0,
      };
    });

    if (!validateStaticData(data)) {
      throw new Error(`Invalid ACOS data structure for ${file}`);
    }
    return data as StaticDataTypes[T];
  }

  throw new Error(`Invalid file type: ${file}`);
}

// Example usage:
// const projectsData = await loadStaticData('projects');
