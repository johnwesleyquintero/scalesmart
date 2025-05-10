# Wesley Quintero - Professional Portfolio

**[View Live Portfolio](https://wesleyquintero.vercel.app/)**

A modern, responsive portfolio website showcasing my skills, projects, and professional experience as a Data-Driven Amazon & E-commerce Specialist.

![Portfolio Preview](public/portfolio-preview.svg)

## Features

- Modern, responsive UI with dark/light mode support.
- Advanced Amazon Seller Tools suite including:
  - ACoS Calculator with historical trend analysis
  - Competitor Analyzer for pricing and listing performance
  - FBA Calculator with basic CSV upload functionality
  - Keyword Deduplicator (core functionality)
- Integrated blog with MDX support, rich typography, and related posts suggestions.

### Enhanced Resume Download

- One-click PDF resume download
- Optimized file size and fast delivery
- Automatic PDF generation from profile data
- Cached for improved performance

### Blog Structure

- MDX-powered content with code highlighting
- Custom SVG illustrations for each post
- Rich typography with Tailwind Typography
- Responsive images and media
- Category-based filtering
- Reading time estimation
- Related posts suggestions

## Technologies Used

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- MDX for blog content
- Lucide React icons
- Vercel hosting

## Projects

- [SellSmart Hub](https://sellsmart-hub.vercel.app/) - AI-powered analytics and automation tools for Amazon sellers
- [DevFlowDB](https://devflowdb.vercel.app/) - Lightweight WASM-powered SQL database
- [Inventory Management](https://sellsmart-docs.vercel.app/) - Streamlined listing management & account health
- [FBA Department Operations](https://sellsmart-docs.vercel.app/) - Comprehensive training & workflow planning
- [SellSmart Design x Docs](https://sellsmart-docs.vercel.app/) - Design system documentation
- [Wholesale Buyer's Guide](https://sellsmart-docs.vercel.app/) - Client engagement & inventory management

## Blog

The portfolio includes a fully-featured blog with MDX support:

- Static generation of blog pages
- Custom SVG illustrations for each post
- Rich typography with Tailwind Typography
- Code syntax highlighting
- Responsive design for all devices

## Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/johnwesleyquintero/portfolio.git
   cd portfolio
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start development server

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Development

To contribute to this project:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## Deployment

This project supports both automatic CI/CD deployment and manual workflows:

### Automated Deployment (CI/CD)

- Pushes to `main` branch trigger production deployment
- PR environments created for branches matching `feat/*` or `fix/*`

### Manual Deployment

```bash
npm install -g vercel@latest
vercel deploy --prod --confirm
```

### Environment Configuration

Ensure these environment variables are set in Vercel:

- `NEXT_PUBLIC_VERCEL_ENV` (production/preview/development)
- `NEXT_PUBLIC_GA_ID` (Analytics)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (Contact form)
- `MONGODB_URI` (Database connection string)
- `MONGODB_DB_NAME` (Database name)
- `KV_URL` (Upstash Redis connection URL)
- `KV_REST_API_TOKEN` (Redis API access token)
- `KV_REST_API_URL` (Redis REST endpoint)

### CI/CD Features

- Automated testing via `vercel.yml`
- Branch preview environments
- Rollback protection
- Deployment status checks

## Environment Variables

Copy `.env.example` to `.env` and update with your own values:

```bash
cp .env.example .env
```

## Available Scripts

- `npm run dev`: Starts development server
- `npm run build`: Creates production build
- `npm run start`: Runs production server
- `npm run lint`: Runs ESLint
- `npm run format`: Formats code with Prettier

## Tech Stack Details

- **Next.js 14**: App Router, Server Components, Streaming
- **TypeScript**: Strict typing throughout the project
- **Tailwind CSS**: Utility-first CSS with dark/light mode support
- **shadcn/ui**: Accessible, customizable components
- **MDX**: Markdown with React component support

## Tools Documentation

| Tool Name            | Status  | Version | Core Features                         | Implementation Status                   | Planned Enhancements                    |
| -------------------- | ------- | ------- | ------------------------------------- | --------------------------------------- | --------------------------------------- |
| ACoS Calculator      | Active  | 1.5.0   | Campaign tracking, Revenue analysis   | Core functionality complete             | Advanced visualization, Export options  |
| PPC Campaign Auditor | Beta    | 0.9.0   | Performance metrics, Bid optimization | Basic metrics implemented               | AI-powered suggestions, Trend analysis  |
| Description Editor   | Active  | 1.5.0   | HTML formatting, Keyword integration  | Core functionality complete             | Enhanced SEO tools, Mobile optimization |
| Keyword Deduplicator | Active  | 1.5.0   | Bulk processing, Duplicate detection  | Core functionality with pending updates | AI suggestions, Performance tracking    |
| Competitor Analyzer  | Planned | -       | Market research, Pricing analysis     | In development                          | Data enrichment, Automated monitoring   |

---

[//]: # (Documentation last updated: ${new Date().toISOString()})
