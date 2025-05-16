# CourseListServer Documentation (`src/app/academy/CourseListServer.tsx`)

## Overview

The `CourseListServer` (`src/app/academy/CourseListServer.tsx`) component fetches and displays a list of courses from an API endpoint. It is a server component, meaning it fetches the data on the server before rendering the component.

## Functionality

- **Fetches Courses from API:** Fetches a list of courses from the API endpoint defined in the `NEXT_PUBLIC_API_URL` environment variable.
- **Displays Course List:** Renders a list of courses using the `CourseList` component.

## Technical Details

- The component is a server component, meaning it fetches the data on the server before rendering the component.
- The component uses the `fetch` API to make the API request.
- The component uses the `NEXT_PUBLIC_API_URL` environment variable to determine the API endpoint.

## Components

- `CourseListServer`: The main component that fetches and displays the list of courses.
- `CourseList`: A component that renders the list of courses.

## Data Flow

1.  The `CourseListServer` component is rendered.
2.  The component calls the `fetchCourses` function to fetch the list of courses from the API endpoint.
3.  The `fetchCourses` function makes an API request to the endpoint defined in the `NEXT_PUBLIC_API_URL` environment variable.
4.  The API returns a list of courses.
5.  The `CourseListServer` component then renders the `CourseList` component, passing the list of courses as the `courses` prop.
6.  The `CourseList` component renders a list of courses, displaying the title, description, duration, and level of each course.
