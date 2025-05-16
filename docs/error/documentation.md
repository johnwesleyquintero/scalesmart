# Custom Error Page Documentation (`src/app/error.tsx`)

## Overview

The Custom Error page (`src/app/error.tsx`) is displayed when an unexpected error occurs in the application. It provides a user-friendly message and options to try again or go back to the home page.

## Functionality

- **Displays Error Message:** Shows a friendly error message to the user.
- **Provides Try Again Button:** Allows the user to attempt to recover from the error by resetting the error boundary.
- **Provides Back to Home Button:** Allows the user to navigate back to the home page.
- **Links to Error Guide:** Provides a link to the error guide documentation for more details.
- **Logs Error to Console:** Logs the error to the console for debugging purposes.

## Technical Details

- The page is a client-side component.
- It uses the `AlertTriangle` icon from the `lucide-react` library.
- It uses the `Button` component from the `@/components/ui/button` library.
- It uses the `Link` component from `next/link` for navigation.

## Components

- `CustomError`: The main error page component.

## Data Flow

1.  When an error occurs within an error boundary, the `CustomError` component is rendered.
2.  The `error` prop contains the error object.
3.  The `reset` prop is a function that resets the error boundary, allowing the user to try again.
4.  The component displays the error message and provides the "Try Again" and "Back to Home" buttons.
5.  The component logs the error to the console.
