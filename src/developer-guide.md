# Developer Guide

This guide outlines the conventions and best practices for contributing to this project. Adhering to these guidelines ensures code consistency, maintainability, and clarity for all developers.

## 1. Code Style

We follow a consistent code style based on a combination of [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/).

- **Automatic Formatting**: Ensure your IDE is set up to format code with Prettier on save.
- **Linting**: Address all warnings and errors reported by ESLint before committing code.

## 2. Documentation (JSDoc)

All new functions, classes, types, and significant variables must be documented using JSDoc.

### JSDoc Examples:

#### Functions

```javascript
/**
 * Calculates the sum of two numbers.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of a and b.
 */
function add(a, b) {
  return a + b;
}
```

#### Types/Interfaces (using `@typedef` for objects or `@property` for schema definitions)

```typescript
/**
 * @typedef {object} UserProfile
 * @property {string} id - The unique identifier of the user.
 * @property {string} name - The full name of the user.
 * @property {string} [email] - Optional email address of the user.
 * @property {boolean} isActive - Indicates if the user account is active.
 */
type UserProfile = {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
};
```

#### Constants

```javascript
/**
 * @constant {number} MAX_RETRIES - The maximum number of retry attempts for an operation.
 */
const MAX_RETRIES = 5;
```

## 3. File Organization

Files and directories should be organized logically to reflect their domain and purpose.

- **`docs/`**: Project documentation, including design system guidelines and general project information.
- **`lib/`**: Root-level utility functions or configurations that are not specific to the `src` directory.
- **`public/`**: Static assets served directly by the web server (e.g., images, fonts, manifest files).
- **`scripts/`**: Standalone utility scripts for development, build processes, or maintenance tasks.
- **`src/actions/`**: Contains server actions for Next.js.
- **`src/app/`**: Holds Next.js App Router specific pages, layouts, and API routes.
- **`src/app/layout.tsx`**: The main layout file, serving as the primary navigator and structural component for the application.
- **`src/app/content/`**: Contains MDX content files specific to different application sections.
- **`src/components/`**: Reusable UI components. Categorize into subdirectories (e.g., `components/ui/`, `components/shared/`) as complexity grows.
- **`src/config/`**: Configuration files (e.g., application settings, API keys).
- **`src/context/`**: React Context API providers.
- **`src/data/`**: Static data, JSON files, or mock data.
- **`src/hooks/`**: Custom React hooks.
- **`src/lib/`**: Utility functions, helper classes, and non-React logic. This is typically where business logic resides.
- **`src/docs/`**: Markdown or MDX files for in-app documentation.
- **`src/pages/`**: (Legacy) React components for page-based routing. Prefer `src/app/` for new pages.
- **`src/styles/`**: Global stylesheets, CSS modules, or Tailwind CSS configurations.
- **`src/types/`**: TypeScript type definitions and interfaces.
- **`src/utils/`**: General utility functions and helper modules.

## 4. Commits

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This helps in generating changelogs and understanding the nature of changes.

Examples:

- `feat: add user authentication`
- `fix: correct typo in documentation`
- `docs: update developer guide`
- `refactor: improve MdxRenderer performance`

## 5. Architectural Patterns

The project leverages several architectural patterns facilitated by the Next.js framework:

- **App Router:** Utilizes the latest Next.js App Router for routing, server components, and co-location of components, tests, and styles.
- **Component-Based Architecture:** Follows a component-based approach using React, with reusable UI components located in `src/components/`.
- **API Routes:** Implements API endpoints within `src/app/api/` for server-side logic and data fetching.
- **Data Fetching:** Employs a mix of server-side data fetching (in Server Components) and client-side fetching (using React Query or similar patterns) depending on the data's nature and where it's needed.
- **Local State Management:** Utilizes React Context API (`src/context/`) and custom hooks (`src/hooks/`) for managing local state within features.
- **IndexedDB for Local Data:** IndexedDB (`src/lib/indexeddb/`) is used for select modules to provide persistent local storage and reduce reliance on the backend.

## 6. Common Utilities and Helper Functions

The `src/lib/` directory is a central place for reusable logic that is not tied to specific React components or hooks. Key utility files include:

- [`src/lib/utils.ts`](src/lib/utils.ts): Contains general-purpose helper functions.
- [`src/lib/api-error-handler.ts`](src/lib/api-error-handler.ts): Provides standardized error handling for API routes.
- [`src/lib/logger.ts`](src/lib/logger.ts): A utility for logging messages across the application.
- [`src/lib/utils.ts`](src/lib/utils.ts): Core utility functions.
- [`src/lib/types.ts`](src/lib/types.ts): Contains shared TypeScript type definitions.
- [`src/lib/types.ts`](src/lib/types.ts): Contains shared TypeScript type definitions.

Developers are encouraged to explore this directory before writing new utility functions to avoid duplication.

## 7. Feature/Module Development Notes

This section provides brief notes on developing specific modules within the platform. For detailed implementation, refer to the respective directories in `src/app/`.
