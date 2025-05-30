---
title: NextAuth Environment Variables
description: Documentation for NextAuth environment variables in Amazon Seller Tools.
---

# NextAuth.js Environment Variables Documentation (`src/app/api/auth/[...nextauth]/env.d.ts`)

## Overview

The `src/app/api/auth/[...nextauth]/env.d.ts` file defines the environment variables used by NextAuth.js.

## Functionality

- **Defines Environment Variables:** Defines the `NEXTAUTH_SECRET` and `NEXTAUTH_URL` environment variables.

## Technical Details

- The file uses the `declare namespace NodeJS` syntax to augment the `NodeJS.ProcessEnv` interface.
- The `NEXTAUTH_SECRET` environment variable is used to encrypt the JWT.
- The `NEXTAUTH_URL` environment variable is used to define the base URL for NextAuth.js.

## Data Flow

1.  The `env.d.ts` file defines the environment variables.
2.  The `NextAuth` function in `src/app/api/auth/[...nextauth]/route.ts` and the `authOptions` object in `src/app/api/auth/[...nextauth]/options.ts` use these environment variables to configure the authentication.
