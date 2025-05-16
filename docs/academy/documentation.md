# Academy Page Documentation (`src/app/academy/page.tsx`)

## Overview

The Academy Page (`src/app/academy/page.tsx`) is the main page for the academy section of the application. It serves as the entry point for users to access the academy's content and features.

## Functionality

- **Renders SchoolComponent:** The primary function of this page is to render the `SchoolComponent`, which contains the core UI and logic for the academy section.

## Technical Details

- The page is a simple functional component that imports and renders another component.
- It relies on the `SchoolComponent` to handle the actual content and functionality of the academy page.

## Components

- `AcademyPage`: The main academy page component.
- `SchoolComponent`: The component that is rendered by the `AcademyPage`.

## Data Flow

1.  The `AcademyPage` component is rendered when a user navigates to the `/academy` route.
2.  The component imports and renders the `SchoolComponent`.
3.  The `SchoolComponent` then handles the display of the academy's content and features.
