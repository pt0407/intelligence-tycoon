# Intelligence Tycoon

A browser-based multiplayer AI business simulation game where players build AI companies, manage resources, and compete in a dynamic economy.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase, Prisma
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Real-time:** Supabase Realtime

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. Install dependencies: `npm install`
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/types` - TypeScript type definitions

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
