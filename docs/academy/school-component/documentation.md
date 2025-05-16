# SchoolComponent Documentation (`src/app/academy/SchoolComponent.tsx`)

## Overview

The `SchoolComponent` (`src/app/academy/SchoolComponent.tsx`) fetches and displays a list of courses from an API endpoint. It uses the `AcademyProvider` to provide context to the `AcademyContentClient` component, which then renders the list of courses.

## Functionality

- **Fetches Courses from API:** Fetches a list of courses from the `/api/academy-courses` endpoint.
- **Displays Loading State:** Shows a loading message while the courses are being fetched.
- **Displays Error State:** Shows an error message if there is an error fetching the courses.
- **Provides Academy Context:** Uses the `AcademyProvider` to provide the list of courses to the `AcademyContentClient` component.
- **Renders Course List:** Renders a list of courses using the `CourseList` component.

## Technical Details

- The component uses the `useState` hook to manage the state of the courses, loading, and error.
- The component uses the `useEffect` hook to fetch the courses from the API when the component mounts.
- The component uses the `fetch` API to make the API request.
- The component uses the `AcademyProvider` to provide context to the `AcademyContentClient` component.

## Components

- `SchoolComponent`: The main component that fetches and displays the list of courses.
- `CourseList`: A component that renders the list of courses.

## Data Flow

1.  The `SchoolComponent` is rendered.
2.  The `useEffect` hook is called, which fetches the list of courses from the `/api/academy-courses` endpoint.
3.  While the courses are being fetched, the component displays a loading message.
4.  If there is an error fetching the courses, the component displays an error message.
5.  Once the courses have been fetched successfully, the component updates the state with the list of courses.
6.  The component then renders the `AcademyProvider`, passing the list of courses as the `initialCourses` prop.
7.  The `AcademyProvider` provides the list of courses to the `AcademyContentClient` component.
8.  The `AcademyContentClient` component renders the `CourseList` component, passing the list of courses as the `courses` prop.
9.  The `CourseList` component renders a list of courses, displaying the title, description, duration, and level of each course.
