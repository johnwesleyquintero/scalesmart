import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Constants for file paths and extensions
const DOCS_CONTENT_PATH = path.join(process.cwd(), 'src/app/content/docs');
const OUTPUT_FILE_PATH = path.join(
  process.cwd(),
  'src/data/portfolio-data/docs.json',
);
const MARKDOWN_FILE_EXTENSIONS = ['.mdx', '.md'];
const MARKDOWN_FILE_REGEX = /\.(mdx|md)$/;

/**
 * Reads and processes markdown files from a directory.
 * @param {string} directoryPath - Path to the directory containing markdown files.
 * @returns {Promise<Array>} - Array of processed document data.
 */
async function processMarkdownFiles(directoryPath) {
  const files = await fs.promises.readdir(directoryPath); // Use async readdir
  const docsDataPromises = files.map(async (file) => {
    if (MARKDOWN_FILE_EXTENSIONS.some((ext) => file.endsWith(ext))) {
      const fullPath = path.join(directoryPath, file);
      try {
        const fileContents = await fs.promises.readFile(fullPath, 'utf8');
        const { data } = matter(fileContents);
        const slug = file.replace(MARKDOWN_FILE_REGEX, '');

        return {
          slug,
          title: data.title || slug,
          description: data.description || '',
          category: data.category || 'Uncategorized',
          order: data.order || 0,
          tags: data.tags || [],
          date: data.date
            ? new Date(data.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        };
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        return null;
      }
    }
    return null;
  });

  const docsData = (await Promise.all(docsDataPromises)).filter(Boolean);
  return docsData;
}

/**
 * Sorts documents by category and order.
 * @param {Array} docsData - Array of document data to sort.
 * @returns {Array} - Sorted array of document data.
 */
function sortDocsData(docsData) {
  return docsData.sort((a, b) => {
    const categoryA = a.category || '';
    const categoryB = b.category || '';

    if (categoryA === categoryB) {
      return a.order - b.order;
    }
    return categoryA.localeCompare(categoryB);
  });
}

/**
 * Generates a JSON file containing processed document data.
 */
async function generateDocsJson() {
  console.log('Generating docs.json...');

  try {
    if (!fs.existsSync(DOCS_CONTENT_PATH)) {
      console.warn(
        `Docs content path not found: ${DOCS_CONTENT_PATH}. Skipping docs.json generation.`,
      );
      fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify({ docs: [] }, null, 2));
      return;
    }

    const allDocsData = await processMarkdownFiles(DOCS_CONTENT_PATH);
    const sortedDocsData = sortDocsData(allDocsData);

    fs.writeFileSync(
      OUTPUT_FILE_PATH,
      JSON.stringify({ docs: sortedDocsData }, null, 2),
    );
    console.log(
      `Successfully generated docs.json with ${sortedDocsData.length} documents.`,
    );
  } catch (error) {
    console.error('Error generating docs.json:', error);
  }
}

generateDocsJson().catch(console.error);
