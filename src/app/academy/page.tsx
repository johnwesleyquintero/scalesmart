import SchoolComponent from './SchoolComponent';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';

const academyDirectory = path.join(process.cwd(), 'src/app/content/academy');

const getAcademyData = cache(async () => {
  const fileNames = fs.readdirSync(academyDirectory);

  const allAcademyData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '');

    const fullPath = path.join(academyDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const matterResult = matter(fileContents);

    return {
      id: slug, // Use slug as id for simplicity
      title: matterResult.data.title || 'Untitled',
      type: matterResult.data.type || 'article',
      description: matterResult.data.description || '',
      duration: matterResult.data.duration || '0 min',
      level: matterResult.data.level || 'Beginner',
      locked: matterResult.data.locked || false,
      progress: 0,
      modules: [],
      slug,
      ...matterResult.data,
    };
  });

  return allAcademyData;
});

export default async function AcademyPage() {
  const academyData = await getAcademyData();
  return <SchoolComponent academyData={academyData} />;
}
