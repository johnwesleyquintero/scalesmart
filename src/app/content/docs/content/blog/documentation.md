---
title: Blog Content Directory Documentation (src/app/content/blog)
description: The `src/app/content/blog` directory contains the MDX files that provide the content for the blog posts.
date: 2025-05-30
tags: ['blog', 'content']
readingTime: '5 min read'
author: 'Wesley Quintero'
type: 'doc'
---

# Blog Content Directory Documentation (`src/app/content/blog`)

## Overview

The `src/app/content/blog` directory contains the MDX files that provide the content for the blog posts. Each MDX file represents a single blog post and includes the content, metadata, and formatting for that post.

## Functionality

- **Stores Blog Post Content:** Stores the content, metadata, and formatting for each blog post in MDX files.

## Technical Details

- The directory contains MDX files, which are a combination of Markdown and JSX.
- Each MDX file represents a single blog post.
- The MDX files are used by the `src/app/blog/[slug]/page.tsx` file to render the blog post content.

## Data Flow

1.  The `src/app/blog/[slug]/page.tsx` file fetches the content of a blog post from the corresponding MDX file in the `src/app/content/blog` directory.
2.  The `MDXRemote` component is used to render the MDX content.
