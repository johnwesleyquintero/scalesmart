# Portfolio Project

## Description

This project is a comprehensive portfolio platform, the "ScaleSmart" (AKA WesVerse) built with Next.js, TypeScript, and Tailwind CSS. It showcases an integrated suite of custom-built applications and tools, demonstrating a wide range of skills. The current "WesApps" include:

- Blog (Content managed via MDX files in `src/app/content/blog/`)
- **ScaleSmart Academy:** An online learning platform with course progress tracking. (Content managed via MDX files in `src/app/content/academy/`)
- **Admin Dashboard:** For managing project content and settings.
- **Amazon Seller Tools:** A suite of tools for Amazon sellers, including Analytics Processing, Data Filtering, Listing Optimization AI, and Report Processing.
- **Resume Scan:** A Resume Scanner/ATS tool.
- **AI Chat Interface:**
- **CRM:** A Customer Relationship Management tool.
- **Project Board:** A project management tool with task and comment management.
- **Workflow Builder:** A workflow automation builder with a visual interface for creating and managing workflows using a node registry and engine.
- **Markdown Notepad:** A tool for creating and managing markdown notes with category support.
- **Privacy Policy:** A dedicated page for the project's privacy policy.
- **User Profile:** A page for managing user profile information.
- **Prompt Request Generator:** A tool for generating prompt requests.

The platform is designed to be an ever-expanding ecosystem, with potential for more "WesIntegrations" in the future.

This project is part of a general improvements plan focused on enhancing documentation for easier onboarding and maintenance.

## Project Structure

Key directories and their purposes:

- `src/app/`: Contains Next.js app router pages and components.
- `src/app/content/`: Houses MDX files for various content sections like blog posts, academy articles, and documentation.
- `src/lib/`: Contains utility functions, services, and libraries used across the project.
- `src/hooks/`: Custom React hooks.
- `src/data/`: Static data files (JSON, etc.).
- `supabase/`: Supabase database migrations and configuration.

## API Routes

The project includes API routes for various functionalities, such as:

- Academy Articles
- Academy Courses
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

- **Blog:** Browse articles and learn about various topics. Content is managed via MDX files.
- **ScaleSmart Academy:** Access courses and learning materials and track your progress. Content is managed via MDX files.
- **Admin Dashboard:** Manage project content and settings.
- **Amazon Seller Tools:** Utilize tools for Amazon seller activities, including analytics, data filtering, listing optimization, and report processing. Data is stored locally using IndexedDB.
- **Resume Scan:** Scan and analyze resumes using the ATS tool.
- **AI Chat Interface:** Communicate with others through the chat feature. Chat history is stored locally using IndexedDB.
- **CRM:** Manage customer relationships. Data is stored locally using IndexedDB.
- **Project Board:** Manage projects and tasks, including adding comments. Data is stored locally using IndexedDB.
- **Workflow Builder:** Create and manage automated workflows using a visual interface. Data is stored locally using IndexedDB.
- **Markdown Notepad:** Create and manage your markdown notes, organized by categories. Data is stored locally using IndexedDB.
- **Privacy Policy:** View the project's privacy policy.
- **User Profile:** Manage your user profile information.
- **Prompt Request Generator:** Generate prompt requests for various purposes.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear messages.
4.  Ensure your code adheres to the project's code style and documentation standards as outlined in the [Developer Guide](src/developer-guide.md).
5.  Submit a pull request.

## License

[MIT](LICENSE)
