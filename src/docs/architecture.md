# Application Architecture Documentation

## Client-Server Architecture

```mermaid
flowchart TD
    Client[Next.js Frontend] -->|API Requests| Server[Next.js Server]
    Server -->|Database Queries| Supabase[(Supabase)]
    Server -->|Caching| Redis[(Redis)]
    Client -->|Static Assets| CDN[Vercel CDN]
```

## Key Components

### Frontend Structure

- App Router with React Server Components
- Shadcn/ui component library
- Tailwind CSS styling system
- Client-side state management using React Context

### Backend Services

- Next.js API routes handling:
  - Authentication (Next-Auth)
  - Data mutations
  - Third-party API integrations
- Middleware chain:
  - Rate limiting
  - Request validation
  - Security headers

### Data Layer

- Supabase: Primary data store with PostgreSQL
  - Replaces previous MongoDB implementation
  - Provides realtime capabilities and row-level security
- Redis: Session storage and caching
- Zod: Data validation schema

### Deployment

- Vercel platform configuration
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase connection
  - `REDIS_URL`: Cache connection
  - `NEXTAUTH_SECRET`: Auth encryption

```mermaid
flowchart LR
    Deployment[Vercel] -->|Build Command| Build[npm run build]
    Deployment -->|Serverless Functions| API[Node.js Runtime]
```
