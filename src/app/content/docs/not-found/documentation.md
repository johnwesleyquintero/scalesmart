---
title: Not Found Page Documentation
description: Documentation for the Not Found page.
date: 2025-05-30
tags: ['not-found', 'page']
readingTime: '3 min read'
author: 'Wesley Quintero'
type: 'doc'
---

# Not Found Page Documentation (`src/app/not-found.tsx`)

## Overview

The Not Found Page (`src/app/not-found.tsx`) is displayed when a user tries to access a page that does not exist in the application. It provides a user-friendly message and a button to navigate back to the home page.

## Functionality

- **Displays 404 Error Message:** Shows a prominent "404" error message to indicate that the page was not found.
- **Displays Page Not Found Message:** Shows a user-friendly message explaining that the page could not be found.
- **Provides Back to Home Button:** Allows the user to navigate back to the home page.

## Technical Details

- The page is a client-side component.
- It uses the `ArrowLeft` icon from the `lucide-react` library.
- It uses the `Button` component from the `@/components/ui/button` library.
- It uses the `Link` component from `next/link` for navigation.

## Components

- `NotFound`: The main not found page component.

## Data Flow

1.  When a user tries to access a page that does not exist, the `NotFound` component is rendered.
2.  The component displays the 404 error message and the "Back to Home" button.
3.  When the user clicks the "Back to Home" button, they are navigated back to the home page.
