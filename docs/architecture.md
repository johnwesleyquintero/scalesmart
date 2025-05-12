## Authentication Implementation

This document describes the implementation of the "register" and "sign in" routes, including the API endpoints, data models, and authentication flow.

### API Endpoints

- **/api/register**: This endpoint redirects the user to the GitHub OAuth provider for registration.
- **/api/sign-in**: This endpoint redirects the user to the GitHub OAuth provider for sign-in.
- **/api/auth/[...nextauth]**: This is the main endpoint for NextAuth.js, which handles the authentication flow.

### Authentication Flow

1.  The user accesses the `/api/register` or `/api/sign-in` endpoint.
2.  The user is redirected to the GitHub OAuth provider.
3.  The user authenticates with GitHub.
4.  GitHub redirects the user back to the application with an authorization code.
5.  NextAuth.js handles the authorization code and exchanges it for an access token.
6.  NextAuth.js retrieves the user's profile information from GitHub.
7.  NextAuth.js creates a new user in the database if one does not already exist.
8.  NextAuth.js creates a session for the user.
9.  The user is redirected to the application.

### GitHub OAuth Flow

The application uses NextAuth.js to implement the GitHub OAuth flow. NextAuth.js is a popular authentication library for Next.js applications. It provides a simple and secure way to authenticate users using various OAuth providers, including GitHub.

To configure the GitHub OAuth flow, you need to create a GitHub OAuth application and provide the client ID and client secret to NextAuth.js. You also need to configure the callback URL to point to the `/api/auth/[...nextauth]` endpoint.

### Data Models

The application uses the following data models for user authentication and management:

- **User**: This model represents a user in the system. It contains information such as the user's email, name, image, and role. The [`src/lib/models/user.ts`](src/lib/models/user.ts) file defines the `User` interface and the `UserModel` which uses Mongoose.

  ```typescript
  export interface User {
    email: string;
    name?: string;
    image?: string;
    emailVerified?: Date;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
  }
  ```

### Database Schema

The application uses Supabase as its database. The database schema includes a `users` table to store user information. The `@next-auth/supabase-adapter` is used to connect NextAuth.js to the Supabase database.

```sql
-- Example users table schema
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image VARCHAR(255),
  emailVerified TIMESTAMPTZ,
  role VARCHAR(255) DEFAULT 'user',
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);
```
