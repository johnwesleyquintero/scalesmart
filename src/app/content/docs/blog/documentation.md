---
title: Blog Page Documentation
description: Documentation for the Blog page.
date: 2025-05-30
tags: ['blog', 'page']
readingTime: '5 min read'
author: 'Wesley Quintero'
type: 'doc'
---

# Blog Page Documentation (`src/app/blog/page.tsx`)

## Overview

The `src/app/blog/page.tsx` file defines the main blog page, which displays a list of blog posts. It fetches the blog posts using the `getAllBlogPosts` function from `@/lib/mdx` and renders them in a grid layout.

## Functionality

- **Fetches Blog Posts:** Fetches all blog posts using the `getAllBlogPosts` function from `@/lib/mdx`.
- **Displays Blog Posts:** Renders the blog posts in a grid layout, displaying the title, description, date, reading time, and tags for each post.

## Technical Details

- The page uses the `getAllBlogPosts` function from `@/lib/mdx` to fetch the blog posts.
- The page uses the `ui/card` and `ui/badge` components from the `@/components/ui` library.
- The page uses the `lucide-react` library for icons.
- The page uses the `next/link` component for navigation.

## Data Flow

1.  The `BlogPage` component is rendered.
2.  The component calls the `getAllBlogPosts` function to fetch the blog posts.
3.  The component maps over the blog posts and renders a `Card` component for each post.
4.  The `Card` component displays the title, description, date, reading time, and tags for each post.
5.  The `Link` component is used to create a link to the individual blog post page.
