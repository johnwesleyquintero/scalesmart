import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOCS_CONTENT_PATH = path.join(process.cwd(), 'src/app/content/docs');
const OUTPUT_FILE_PATH = path.join(
  process.cwd(),
  'src/data/portfolio-data/docs.json',
);

const MARKDOWN_FILE_EXTENSIONS = ['.mdx', '.md'];
const MARKDOWN_FILE_REGEX = /\.(mdx|md)$/;

async function generateDocsJson() {
  console.log('Generating docs.json...');

  if (!fs.existsSync(DOCS_CONTENT_PATH)) {
    console.warn(
      `Docs content path not found: ${DOCS_CONTENT_PATH}. Skipping docs.json generation.`,
    );
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify({ docs: [] }, null, 2));
    return;
  }

  const files = fs.readdirSync(DOCS_CONTENT_PATH);
  const allDocsData = [];

  for (const file of files) {
    if (MARKDOWN_FILE_EXTENSIONS.some((ext) => file.endsWith(ext))) {
      const fullPath = path.join(DOCS_CONTENT_PATH, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const slug = file.replace(MARKDOWN_FILE_REGEX, '');

      allDocsData.push({
        slug: slug,
        content: content,
        title: data.title || slug,
        description: data.description || '',
        category: data.category || 'Uncategorized',
        order: data.order || 0,
        tags: data.tags || [],
        date: data.date
          ? new Date(data.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    }
  }

  // Sort docs by category and then by order
  allDocsData.sort((a, b) => {
    const categoryA = a.category || '';
    const categoryB = b.category || '';

    if (categoryA === categoryB) {
      return a.order - b.order;
    }
    return categoryA.localeCompare(categoryB);
  });

  fs.writeFileSync(
    OUTPUT_FILE_PATH,
    JSON.stringify({ docs: allDocsData }, null, 2),
  );
  console.log(
    `Successfully generated docs.json with ${allDocsData.length} documents.`,
  );
}

generateDocsJson().catch(console.error);
