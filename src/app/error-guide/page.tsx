import { promises as fs } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
// Removed unused import: MdxRenderer

// Define the path to the MDX file as a constant for clarity and easier modification.
const ERROR_GUIDE_MDX_PATH = path.join(
  process.cwd(),
  'src',
  'docs',
  'error-guide.mdx',
);

export default async function ErrorGuidePage() {
  let source: string | null = null;
  let error: Error | null = null;

  try {
    // Attempt to read the MDX file asynchronously.
    // Added error handling for robustness.
    source = await fs.readFile(ERROR_GUIDE_MDX_PATH, 'utf8');
  } catch (e) {
    // If file reading fails, catch the error.
    // This prevents the page from crashing if the file doesn't exist or there's a read permission issue.
    console.error(`Failed to read MDX file at ${ERROR_GUIDE_MDX_PATH}:`, e);
    if (e instanceof Error) {
      error = e;
    } else {
      error = new Error('An unknown error occurred while reading the file.');
    }
    // Optionally, you could redirect or render a more specific error page here.
    // For this example, we'll render an error message within the page.
  }

  return (
    // Use standard container classes for consistent layout.
    <div className="container mx-auto px-4 py-8">
      {/* Conditionally render content based on whether the file was read successfully */}
      {source ? (
        // If source is available, render the MDX content.
        // MDXRemote from next-mdx-remote/rsc handles the parsing and rendering on the server.
        <MDXRemote source={source} />
      ) : (
        // If source is null (meaning an error occurred), display an error message.
        <div className="text-red-500">
          <h1>Error loading guide</h1>
          <p>Could not load the content for the error guide.</p>
          {/* Optionally display the error details in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <pre className="mt-4 p-2 bg-gray-100 rounded text-sm">
              {error.message}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
