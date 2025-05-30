---
title: NextAuth.js Options Documentation
description: Documentation for the NextAuth.js options.
date: 2025-05-30
---

# NextAuth.js Options Documentation (`src/app/api/auth/[...nextauth]/options.ts`)

## Overview

The `src/app/api/auth/[...nextauth]/options.ts` file defines the options for NextAuth.js, including the adapter, providers, session strategy, pages, and callbacks.

## Functionality

- **Configures Supabase Adapter:** Configures the Supabase adapter for storing user data.
- **Configures Authentication Providers:** Defines the authentication providers for the application, such as GitHub.
- **Configures Session Strategy:** Configures the session strategy to use JWT (JSON Web Tokens).
- **Configures Pages:** Configures the pages for sign-in and error handling.
- **Defines Callbacks:** Defines callbacks for handling session and JWT data.

## Technical Details

- The file uses the `SupabaseAdapter` from `@next-auth/supabase-adapter` to configure the Supabase adapter.
- The file uses the `GithubProvider` from `next-auth/providers/github` to configure the GitHub authentication provider.
- The file uses environment variables to store the Supabase URL, API key, GitHub client ID, and GitHub client secret.

## Data Flow

1.  The `authOptions` object is exported from the `src/app/api/auth/[...nextauth]/options.ts` file.
2.  The `NextAuth` function in `src/app/api/auth/[...nextauth]/route.ts` imports the `authOptions` object and uses it to configure the authentication.
3.  The authentication provider authenticates the user.
4.  The JWT callbacks are called to handle the JWT data.
5.  The session callbacks are called to handle the session data.
6.  The user is authenticated and redirected to the appropriate page.
