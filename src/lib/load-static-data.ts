import { generateSampleCsv } from './generate-sample-csv';
import { getAllBlogPosts, getAllDocPosts } from './mdx';
import {
  BlogPost,
  CaseStudy,
  Experience,
  Project,
  StaticDataTypes,
} from './static-data-types';

export async function loadStaticData<T extends keyof StaticDataTypes>(
  file: T,
): Promise<StaticDataTypes[T]> {
  if (file === 'docs') {
    const posts = await getAllDocPosts();
    return posts as unknown as StaticDataTypes[T];
  }
  if (file === 'projects') {
    interface ProjectsJson {
      projects: Project[];
    }
    const projectsData = (await import('../data/portfolio-data/projects.json'))
      .default as unknown as ProjectsJson;
    return projectsData.projects.map((project: any, index: number) => {
      const title = project.name || project.title || 'Untitled Project';
      const id = title.toLowerCase().replace(/ /g, '-') + '-' + index;
      const { description, technologies, image, link, github, featured } =
        project;
      const mappedProject: Project = {
        id,
        title,
        description,
        technologies: technologies || [],
        image: image || undefined,
        link: link || undefined,
        github: github || undefined,
        featured: featured || false,
      };
      return mappedProject;
    }) as unknown as StaticDataTypes[T];
  }
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
  if (file === 'changelog') {
    return (await import('../data/portfolio-data/changelog.json')).default
      .changes as unknown as StaticDataTypes[T];
  }
  if (file === 'experience') {
    return (
      await import('../data/portfolio-data/experience.json')
    ).default.experience.map((exp: any) => {
      const { title, company, startDate, endDate, description, achievements } =
        exp;
      const mappedExperience: Experience = {
        company,
        title,
        startDate,
        endDate: endDate || 'Present',
        description: Array.isArray(description) ? description : [description],
        achievements,
      };
      return mappedExperience;
    }) as unknown as StaticDataTypes[T];
  }

  if (file === 'skills') {
    return (await import('../data/portfolio-data/skills.json')).default
      .skills as unknown as StaticDataTypes[T];
  }

  if (file === 'education') {
    return (await import('../data/portfolio-data/education.json')).default
      .education as unknown as StaticDataTypes[T];
  }

  if (file === 'personal') {
    return (await import('../data/portfolio-data/personal.json'))
      .default as unknown as StaticDataTypes[T];
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

  if (file === 'prohibited-keywords') {
    // Load from the single source of truth JSON file
    const data = await import('../data/prohibited-keywords.json');
    // Assuming the JSON file directly contains the array of strings
    return data.default as unknown as StaticDataTypes[T];
  }

  throw new Error(`Invalid file type: ${file}`);
}

// Example usage:
// const projectsData = await loadStaticData('projects');
