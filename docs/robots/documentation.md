# Robots.txt Documentation (`src/app/robots.txt`)

## Overview

The `robots.txt` file (`src/app/robots.txt`) provides instructions to search engine crawlers about which parts of the site they are allowed to access. It helps control the crawling and indexing of the site, ensuring that only relevant content is indexed and that sensitive areas are protected.

## Functionality

- **Allows All Crawlers:** The `User-agent: *` directive allows all search engine crawlers to access the site.
- **Allows All Pages:** The `Allow: /` directive allows crawlers to access all pages on the site.
- **Points to Sitemap:** The `Sitemap: https://wesleyquintero.vercel.app/sitemap.xml` directive tells crawlers the location of the sitemap file, which provides a list of all the pages on the site.

## Technical Details

- The file is a plain text file with specific syntax that search engine crawlers understand.
- The `User-agent` directive specifies the crawler that the rule applies to.
- The `Allow` directive specifies the paths that the crawler is allowed to access.
- The `Sitemap` directive specifies the location of the sitemap file.

## Data Flow

1.  When a search engine crawler visits the site, it first checks the `robots.txt` file.
2.  The crawler reads the directives in the `robots.txt` file to determine which parts of the site it is allowed to access.
3.  The crawler then follows the instructions in the `robots.txt` file to crawl and index the site.
