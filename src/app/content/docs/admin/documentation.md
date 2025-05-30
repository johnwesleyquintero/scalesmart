---
title: Admin Page Documentation
description: The Admin Page (src/app/admin/page.tsx) is the main page for the admin section of the application.
date: 2025-05-30
tags: ['admin', 'page']
readingTime: '5 min read'
author: 'Wesley Quintero'
type: 'doc'
---

# Admin Page Documentation (`src/app/admin/page.tsx`)

## Overview

The Admin Page (`src/app/admin/page.tsx`) is the main page for the admin section of the application. It provides a secure interface for administrators to manage the application.

## Functionality

- **Authenticates User:** Checks if the user is authenticated and has the correct username.
- **Redirects Unauthorized Users:** Redirects unauthorized users to the home page.
- **Displays Admin Dashboard:** Displays the admin dashboard for authorized users.

## Technical Details

- The page uses the `createClient` function from `@supabase/supabase-js` to create a Supabase client.
- The page uses the `getSession` function to get the current user session.
- The page uses the `redirect` function from `next/navigation` to redirect unauthorized users.
- The page uses environment variables to store the Supabase URL and API key.

## Components

- `AdminPage`: The main admin page component.

## Data Flow

1.  The `AdminPage` component is rendered.
2.  The component calls the `getSession` function to get the current user session.
3.  The component checks if the user is authenticated and has the correct username.
4.  If the user is not authenticated or does not have the correct username, the component redirects them to the home page.
5.  If the user is authenticated and has the correct username, the component displays the admin dashboard.
