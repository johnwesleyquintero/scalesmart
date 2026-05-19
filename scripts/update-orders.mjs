import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDir = path.join(process.cwd(), 'src/app/content/blog');
const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx'));

const posts = files.map((file) => {
  const filePath = path.join(blogDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  return {
    file,
    filePath,
    content,
    date: new Date(parsed.data.date || new Date()),
    originalOrder: parsed.data.order,
  };
});

// Sort ascending by date (oldest first).
// If dates are exactly the same, fallback to originalOrder if present to keep relative sorting stable.
posts.sort((a, b) => {
  const diff = a.date.getTime() - b.date.getTime();
  if (diff === 0) {
    return (a.originalOrder || 0) - (b.originalOrder || 0);
  }
  return diff;
});

posts.forEach((post, index) => {
  const newOrder = index + 1; // 1 for oldest, 22 for newest
  let newContent = post.content;

  // Check if order: exists
  const orderRegex = /^order:\s*\d+/m;
  if (orderRegex.test(newContent)) {
    newContent = newContent.replace(orderRegex, `order: ${newOrder}`);
  } else {
    // Find the end of frontmatter (the second ---)
    // matter already gives us the raw frontmatter in parsed.matter, but doing it manually is safe
    const match = newContent.match(/^---\r?\n/gm);
    if (match && match.length >= 2) {
      let parts = newContent.split(/^(---)\r?\n/m);
      if (parts.length >= 5) {
        // Append order to frontmatter
        parts[2] = parts[2].replace(/\r?\n$/, '') + `\norder: ${newOrder}\n`;
        newContent = parts.join('');
      }
    }
  }

  fs.writeFileSync(post.filePath, newContent, 'utf8');
  console.log(`Updated ${post.file} to order: ${newOrder}`);
});
