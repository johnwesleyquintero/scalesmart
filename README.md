# Portfolio Project

## Description

This project is a comprehensive portfolio platform, the "ScaleSmart" (AKA WesVerse) built with Next.js, TypeScript, and Tailwind CSS. It showcases an integrated suite of custom-built applications and tools, demonstrating a wide range of skills. ## Features

- **Amazon Seller Tools**: Comprehensive suite for Amazon sellers, including product research, keyword tracking, listing optimization, and analytics, with SP-API integration and IndexedDB for local data persistence.
- **ATS (Applicant Tracking System) Optimizer**: Helps users optimize resumes for ATS scans by analyzing content, providing compatibility scores, and suggesting improvements.
- **Blog**: A platform for publishing articles and updates, supporting MDX for rich content creation and dynamic rendering.
- **Content Management**: Leverages MDX files for dynamic rendering of blog posts and documentation, allowing for rich, interactive content with embedded React components.
- **CRM (Customer Relationship Management)**: Comprehensive tools for managing customer interactions, tracking sales opportunities, and organizing contact information, with functionalities for customer listing, adding new customers, managing categories, communication logs, and email templates.
- **Dashboard Studio**: A powerful, interactive tool for creating, customizing, and managing dynamic dashboards with various widget types (KPIs, charts, tables, text, images) and data source integration.
- **Error Guide**: Provides a dedicated page to display comprehensive error documentation, dynamically loading and rendering MDX content for troubleshooting and solutions.
- **Markdown Notepad**: A robust and intuitive note-taking application supporting real-time Markdown editing, note management, category systems, search functionality, and persistent local storage via IndexedDB.
- **Privacy Policy Page**: Outlines how user data is collected, used, protected, and managed, dynamically loading content from an MDX file for easy updates.
- **Project Management**: A comprehensive dashboard for organizing and tracking projects and tasks, including task creation, assignment, status updates, project creation, Gantt chart visualization, and local persistence via IndexedDB.
- **Prompt Request Generator**: A specialized tool designed to help users construct well-structured and effective prompts for AI models, guiding them through selecting categories, providing context, detailing requests, and including code snippets.
- **WesAI Chat Feature**: An interactive chat interface powered by AI, allowing users to generate content, get assistance, or interact with an AI model, supporting streaming responses and markdown rendering.

The platform is designed to be an ever-expanding ecosystem, with potential for more "WesIntegrations" in the future.

This project is part of a general improvements plan focused on enhancing documentation for easier onboarding and maintenance.

## Project Structure

Key directories and their purposes:

- `src/app/`: Contains Next.js app router pages and components.
- `src/app/content/`: Houses MDX files for various content sections like blog posts and documentation.
- `src/lib/`: Contains utility functions, services, and libraries used across the project.
- `src/hooks/`: Custom React hooks.
- `src/data/`: Static data files (JSON, etc.).
- `supabase/`: Supabase database migrations and configuration.

## API Routes

The project includes API routes for various functionalities, such as:

- ATS (Resume Processing)
- Amazon Competitor Analysis
- Amazon Inventory
- Amazon Keyword Trends
- Amazon Pricing
- Authentication
- Chat
- Contact
- Content
- Downloads
- Module Progress
- Prohibited Keywords
- Redis
- Resume
- Search

Detailed API documentation can be found in the `src/app/content/docs/api-*.mdx` files.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Redis
- Upstash
- Vercel
- IndexedDB (Used for local data storage in several features)

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Configure environment variables:

    - Create a `.env.local` file based on `.env.example`.
    - Set the necessary environment variables, such as database connection strings and API keys. Note that Supabase setup is required; refer to the Supabase documentation for details on setting up your database and obtaining connection strings.

4.  Run the development server:

    ```bash
    npm run dev
    ```

## Usage

- **Amazon Seller Tools**: Utilize tools for Amazon seller activities, including product research, keyword tracking, listing optimization, and analytics, with SP-API integration and IndexedDB for local data persistence.
- **ATS (Applicant Tracking System) Optimizer**: Scan and analyze resumes using the ATS tool, providing compatibility scores and suggestions for improvement.
- **Blog**: Browse articles and learn about various topics. Content is managed via MDX files, supporting rich content creation and dynamic rendering.
- **Content Management**: Manage various types of content (blog posts, documentation, static pages) using MDX files, leveraging MDX for dynamic rendering and embedded React components.
- **CRM (Customer Relationship Management)**: Manage customer relationships, categories, communication logs, and sales pipelines, with functionalities for customer listing, adding new customers, managing categories, communication logs, and email templates.
- **Dashboard Studio**: Build custom dashboards with drag-and-drop functionality, various widget types (KPIs, charts, tables, text, images), and data source integration.
- **Error Guide**: Access a dynamic guide for common errors, providing comprehensive error documentation dynamically loaded from MDX files.
- **Markdown Notepad**: Create and manage your markdown notes, organized by categories, with real-time Markdown editing, search functionality, and persistent local storage via IndexedDB.
- **Privacy Policy Page**: View the project's privacy policy, which outlines how user data is collected, used, protected, and managed, with dynamic content loading from an MDX file.
- **Project Management**: Manage projects and tasks, including task creation, assignment, status updates, project creation, Gantt chart visualization, and local persistence via IndexedDB.
- **Prompt Request Generator**: Generate structured prompt requests for various purposes, guiding users through selecting categories, providing context, detailing requests, and including code snippets.
- **WesAI Chat Feature**: Communicate with AI through the chat feature, supporting streaming responses and markdown rendering.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear messages.
4.  Ensure your code adheres to the project's code style and documentation standards as outlined in the [Developer Guide](src/developer-guide.md).
5.  Submit a pull request.

## License

[MIT](LICENSE)
