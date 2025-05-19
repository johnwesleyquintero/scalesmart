# Academy Courses API Endpoint Documentation (`src/app/api/academy-courses/route.ts`)

## Overview

The Academy Courses API endpoint (`src/app/api/academy-courses/route.ts`) returns a list of academy courses from a JSON file.

## Functionality

- **Returns List of Academy Courses:** Returns a list of academy courses from the MDX files in `src/app/content/academy`.

## Technical Details

- The endpoint uses the `NextResponse` object from `next/server` to return the JSON response.
- The endpoint fetches the list of courses from the MDX files in `src/app/content/academy` and parses the metadata using `gray-matter`.
- The endpoint uses the `Cache-Control` header for caching.

## Data Flow

1.  A request is made to the `/api/academy-courses` endpoint.
2.  The endpoint fetches the list of courses from the MDX files in `src/app/content/academy` and parses the metadata using `gray-matter`.
3.  The endpoint returns the list of courses as a JSON response.

## Request Methods

### `GET`

Returns a list of academy courses.

#### Success Response

-   **Code:** 200 OK

#### Example

```json
[
    {
        "slug": "example-course",
        "title": "Example Course",
        "description": "This is an example course.",
        "modules": []
    }
]
```

### `POST`

Creates a new academy course. **Note: This method is not fully implemented and may not function as expected.**

#### Request Body

```json
{
    "title": "New Course",
    "description": "This is a new course.",
    "modules": []
}
```

#### Success Response

-   **Code:** 201 Created
-   **Content:** `{ "message": "Course created successfully" }`

#### Error Response

-   **Code:** 400 Bad Request
-   **Content:** `{ "message": "Title is required" }`

### `PUT`

Updates an existing academy course. **Note: This method is not fully implemented and may not function as expected.**

#### Request Body

```json
{
    "title": "Updated Course",
    "description": "This is an updated course.",
    "modules": []
}
```

#### Success Response

-   **Code:** 200 OK
-   **Content:** `{ "message": "Course updated successfully" }`

#### Error Response

-   **Code:** 400 Bad Request
-   **Content:** `{ "message": "Title is required" }`

### `DELETE`

Deletes an academy course. **Note: This method is not fully implemented and may not function as expected.**

#### Request Body

```json
{
    "title": "Course to Delete",
    "description": "This course will be deleted.",
    "modules": []
}
```

#### Success Response

-   **Code:** 200 OK
-   **Content:** `{ "message": "Course deleted successfully" }`

#### Error Response

-   **Code:** 400 Bad Request
-   **Content:** `{ "message": "Title is required" }`
