# Academy Courses API Endpoint Documentation (`src/app/api/academy-courses/route.ts`)

## Overview

The Academy Courses API endpoint (`src/app/api/academy-courses/route.ts`) is responsible for reading academy course data, including metadata and content, from MDX files stored in the `c:\Users\johnw\portfolio\src\app\content\academy` directory.

## Functionality

- **Reads and Serves Course Data:** Fetches all MDX files from `c:\Users\johnw\portfolio\src\app\content\academy`, parses their frontmatter (metadata) using `gray-matter`, and potentially includes the MDX content itself.
- **Provides Standardized Course Information:** Returns a structured list of courses with standardized metadata fields.

## Technical Details

- The endpoint uses the `NextResponse` object from `next/server` to return the JSON response.
- The endpoint reads MDX files from the `c:\Users\johnw\portfolio\src\app\content\academy` directory.
- Metadata is parsed from the MDX frontmatter using `gray-matter`.
- The endpoint uses the `Cache-Control` header for caching.

## Data Flow

1.  A request is made to the `/api/academy-courses` endpoint.
2.  The endpoint reads all MDX files from `c:\Users\johnw\portfolio\src\app\content\academy`.
3.  For each file, it parses the frontmatter (metadata) and extracts the MDX content.
4.  The endpoint returns an array of course objects, including their metadata and potentially the MDX content, as a JSON response.

## Request Methods

### `GET`

Returns a list of academy courses from MDX files located in `c:\Users\johnw\portfolio\src\app\content\academy`.

#### Success Response

- **Code:** 200 OK

#### Example

```json
[
  {
    "slug": "example-course",
    "title": "Example Course",
    "description": "This is an example course.",
    "duration": "1h 30m",
    "level": "Beginner",
    "category": "Amazon Basics",
    "tags": ["FBA", "Product Listing"],
    "author": "ScaleSmart Team",
    "interactive": false,
    "content": "---\ntitle: Example Course Module 1\n---\n\n# Module 1 Content\n\nThis is the actual MDX content for the first module...",
    "modules": [
      {
        "slug": "module-1",
        "title": "Module 1: Introduction",
        "content": "MDX content for module 1..."
      }
    ]
  }
]
