# Academy Courses API Endpoint Documentation (`src/app/api/academy-courses/route.ts`)

## Overview

The Academy Courses API endpoint (`src/app/api/academy-courses/route.ts`) returns a list of academy courses from a JSON file.

## Functionality

- **Returns List of Academy Courses:** Returns a list of academy courses from the `src/data/portfolio-data/courses.json` file.

## Technical Details

- The endpoint uses the `NextResponse` object from `next/server` to return the JSON response.
- The endpoint imports the list of courses from the `src/data/portfolio-data/courses.json` file.

## Data Flow

1.  A request is made to the `/api/academy-courses` endpoint.
2.  The endpoint fetches the list of courses. (Implementation TBD)
3.  The endpoint returns the list of courses as a JSON response.
