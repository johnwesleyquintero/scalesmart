# Portfolio Project

## Description

This project is a comprehensive portfolio platform, the "ScaleSmart" (AKA WesVerse) built with Next.js, TypeScript, and Tailwind CSS. It showcases an integrated suite of custom-built applications and tools, demonstrating a wide range of skills. ## Features

- **Blog**: A platform for publishing articles and updates, supporting MDX for rich content creation and dynamic rendering.
- **Content Management**: Leverages MDX files for dynamic rendering of blog posts and documentation, allowing for rich, interactive content with embedded React components.
- **Error Guide**: Provides a dedicated page to display comprehensive error documentation, dynamically loading and rendering MDX content for troubleshooting and solutions.
- **Privacy Policy Page**: Outlines how user data is collected, used, protected, and managed, dynamically loading content from an MDX file for easy updates.
- **Prompt Request Generator**: A specialized tool designed to help users construct well-structured and effective prompts for AI models, guiding them through selecting categories, providing context, detailing requests, and including code snippets.

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

- Authentication
- Contact
- Content
- Downloads
- Module Progress
- Prohibited Keywords
- Search

Detailed API documentation can be found in the `src/app/content/docs/api-*.mdx` files.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- LocalStorage (Used for local data storage in several features)

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

- **Blog**: Browse articles and learn about various topics. Content is managed via MDX files, supporting rich content creation and dynamic rendering.
- **Content Management**: Manage various types of content (blog posts, documentation, static pages) using MDX files, leveraging MDX for dynamic rendering and embedded React components.
- **Error Guide**: Access a dynamic guide for common errors, providing comprehensive error documentation dynamically loaded from MDX files.
- **Privacy Policy Page**: View the project's privacy policy, which outlines how user data is collected, used, protected, and managed, with dynamic content loading from an MDX file.
- **Prompt Request Generator**: Generate structured prompt requests for various purposes, guiding users through selecting categories, providing context, detailing requests, and including code snippets.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear messages.
4.  Ensure your code adheres to the project's code style and documentation standards as outlined in the [Developer Guide](src/developer-guide.md).
5.  Submit a pull request.

## License

[MIT](LICENSE)
