# JobTrackr

**Track job applications in one place** — a small, focused dashboard to log roles, companies, and notes, and move each application through your pipeline with clear status and filters.

## Features

- **Pipeline statuses** — Applied, Interview, Offer, and Rejected, with color-coded labels
- **Dashboard** — Stats overview, filter chips, and a responsive card grid (with motion on updates)
- **CRUD** — Add applications with company, role, applied date, and optional notes
- **Accounts** — Email sign-in and sign-up via [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Your data** — Each user only sees their own applications, stored in PostgreSQL via [Prisma](https://www.prisma.io/)

## Tech stack

| Layer | Choice |
|--------|--------|
| App | [Next.js](https://nextjs.org/) (App Router), React, TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Motion | [Framer Motion](https://www.framer.com/motion/) |
| Auth & DB host | [Supabase](https://supabase.com/) |
| ORM | [Prisma](https://www.prisma.io/) + `pg` (driver adapter) |

## Prerequisites

- **Node.js** 20 or newer (recommended)
- A **Supabase** project with Auth enabled and a **PostgreSQL** database you can connect to from your machine (or use Supabase’s connection strings)

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd jobtrackr
npm install
```

`postinstall` runs `prisma generate` so the client matches `prisma/schema.prisma`.

### 2. Environment variables

Create **`.env.local`** in the project root (this file is not committed):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `DATABASE_URL` | PostgreSQL URL used by the app at runtime (Prisma + `pg`) |
| `DIRECT_URL` | URL used by the Prisma CLI for migrations (`prisma.config.ts`); often your direct/session pooler URL from Supabase, or the same as `DATABASE_URL` for local Postgres |

Use Supabase **Settings → API** for the public keys and **Settings → Database** for connection strings.

### 3. Apply the database schema

```bash
npx prisma db push
```

Use `npx prisma migrate dev` instead if you maintain migration files in `prisma/migrations`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## License

This project is released into the public domain — see [LICENSE](LICENSE) for the full text.
