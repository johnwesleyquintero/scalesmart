# Academy Page Documentation (`src/app/academy/page.tsx`)

## Overview

The Academy Page (`src/app/academy/page.tsx`) is the main page for the academy section of the application. It serves as the entry point for users to access the academy's content and features.

## Functionality

- **Renders SchoolComponent:** The primary function of this page is to render the `SchoolComponent`, which contains the core UI and logic for the academy section.

## Technical Details

- The page is a simple functional component that imports and renders another component.
- It relies on the `SchoolComponent` to handle the actual content and functionality of the academy page.

## Recent Changes

- Refactored course level styling in `CourseListServer.tsx` using a `getLevelTextColor` utility function.
- Refactored filtering and sorting logic in `SchoolComponent.tsx` into `filterCourses` and `sortCourses` utility functions.
- Improved code organization and readability.
- Added `academy_enhancement_plan.md` to document the academy enhancement plan.
- Removed `mdx_structure_plan.md`.

## Components

- `AcademyPage`: The main academy page component.
- `SchoolComponent`: The component that is rendered by the `AcademyPage`. It receives the `academyData` prop, which is an array of `Course` objects.

## Data Flow

1.  The `AcademyPage` component is rendered when a user navigates to the `/academy` route.
2.  The component imports and renders the `SchoolComponent`.
3.  The `SchoolComponent` then handles the display of the academy's content and features.

## Data Structures

### Course Interface

The `Course` interface defines the structure of a course object. It has the following properties:

- `id`: A unique identifier for the course.
- `title`: The title of the course.
- `type`: The type of the course (e.g., `article`, `video`, `quiz`).
- `description`: A brief description of the course.
- `duration`: The estimated duration of the course.
- `level`: The difficulty level of the course (e.g., `Beginner`, `Intermediate`, `Advanced`).
- `locked`: A boolean indicating whether the course is locked or unlocked.
- `progress`: The user's progress in the course (as a percentage).
- `modules`: An array of `Module` objects that make up the course.
- `category`: The category of the course (e.g., `Amazon SEO`, `Amazon PPC`, `Amazon FBA`).
- `slug`: A unique slug for the course, used in the URL.
