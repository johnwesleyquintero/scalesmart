import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { Heading as MdastHeading } from 'mdast'; // Import Heading type from mdast

export interface Heading {
  id: string;
  text: string;
  level: number;
}

// Simple slugification function to generate IDs from heading text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove all non-word characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from the start and end
}

export async function getHeadingsFromMdx(markdown: string): Promise<Heading[]> {
  const headings: Heading[] = [];

  await remark()
    .use(() => (tree) => {
      visit(tree, ['heading'], (node) => {
        const headingNode = node as MdastHeading; // Cast to MdastHeading to access 'depth'
        const level = headingNode.depth;
        const text = toString(headingNode);
        const id = slugify(text); // Generate ID using slugify

        if (id && text && level >= 1 && level <= 4) {
          // Only include H1-H4 headings
          headings.push({ id, text, level });
        }
      });
    })
    .process(markdown);

  return headings;
}
