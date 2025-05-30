---
title: Content API Endpoint Documentation
description: Documentation for the Content API endpoint.
date: 2025-05-30
---

# Content API Endpoint Documentation (`src/app/api/content/route.ts`)

## Overview

The `src/app/api/content/route.ts` file defines an API endpoint that fetches content data, including skills from a JSON file and projects from the GitHub API.

## Functionality

- **Fetches Skills Data:** Fetches skills data from the `src/data/portfolio-data/skills.json` file.
- **Fetches GitHub Projects:** Fetches project data from the GitHub API.
- **Returns JSON Response:** Returns the skills and projects data as a JSON response.

## Technical Details

- The endpoint uses the `getGitHubProjects` function from `@/lib/github` to fetch project data from the GitHub API.
- The endpoint imports the skills data from the `src/data/portfolio-data/skills.json` file.

## Data Flow

1.  A GET request is made to the `/api/content` endpoint.
2.  The endpoint fetches skills data from the `src/data/portfolio-data/skills.json` file.
3.  The endpoint fetches project data from the GitHub API using the `getGitHubProjects` function.
4.  The endpoint returns the skills and projects data as a JSON response.
