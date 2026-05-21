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
    parsed,
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

  post.parsed.data.order = newOrder;
  const newContent = matter.stringify(post.parsed.content, post.parsed.data);

  fs.writeFileSync(post.filePath, newContent, 'utf8');
  console.log(`Updated ${post.file} to order: ${newOrder}`);
});
