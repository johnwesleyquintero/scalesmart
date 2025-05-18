# Download API Endpoint Documentation (`src/app/api/download/route.ts`)

## Overview

The `src/app/api/download/route.ts` file defines an API endpoint that serves the `sample_amazon_data.csv` file for download.

## Functionality

- **Serves CSV File for Download:** Serves the `sample_amazon_data.csv` file from the `src/data/amazon-tools-sample-data` directory for download.

## Technical Details

- The endpoint uses the `readFile` function from `fs/promises` to read the CSV file.
- The endpoint uses the `NextResponse` object from `next/server` to return the file with the appropriate headers.
- The `Content-Type` header is set to `text/csv`.
- The `Content-Disposition` header is set to `attachment; filename="sample_amazon_data.csv"` to force the browser to download the file.

## Data Flow

1.  A GET request is made to the `/api/download` endpoint.
2.  The endpoint reads the CSV file from the file system.
3.  The endpoint returns the CSV file with the appropriate headers.
