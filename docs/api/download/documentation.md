# Download API Endpoint Documentation (`src/app/api/download/route.ts`)

## Overview

The `src/app/api/download/route.ts` file defines an API endpoint that serves a PDF file (resume) for download.

## Functionality

- **Serves PDF File for Download:** Serves the `Wesley Quintero - Resume.pdf` file from the `public/profile` directory for download.

## Technical Details

- The endpoint uses the `readFile` function from `fs/promises` to read the PDF file.
- The endpoint uses the `NextResponse` object from `next/server` to return the file with the appropriate headers.
- The `Content-Type` header is set to `application/pdf`.
- The `Content-Disposition` header is set to `attachment; filename="Wesley_Quintero_Resume.pdf"` to force the browser to download the file.

## Data Flow

1.  A GET request is made to the `/api/download` endpoint.
2.  The endpoint reads the PDF file from the file system.
3.  The endpoint returns the PDF file with the appropriate headers.
