# IGAMIS

Integrated Government Asset Management Information System for the Government of Kenya, managed by The National Treasury.

## Stack

- Next.js App Router, React, TypeScript and Tailwind CSS
- ShadCN-style owned UI primitives in `src/components/ui`
- PostgreSQL with Prisma ORM
- Supabase Auth and Storage integration points
- Recharts dashboards, server actions and API routes

## Run locally

```bash
npm install
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

## Database setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a PostgreSQL or Supabase Postgres connection string.
3. Run:

```bash
npm run prisma:migrate
npm run seed
```

The UI works with demo data when `DATABASE_URL` is not configured, and switches to PostgreSQL through Prisma when it is available.

## Demo accounts

- `treasury.admin@igamis.go.ke` / `IGAMIS@2026`
- `health.admin@igamis.go.ke` / `IGAMIS@2026`
- `fleet@igamis.go.ke` / `IGAMIS@2026`
- `auditor@igamis.go.ke` / `IGAMIS@2026`

## Production notes

- Supabase Auth is used when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.
- Supabase Storage bucket should be set with `SUPABASE_STORAGE_BUCKET`.
- RBAC permissions are centralized in `src/data/demo.ts` and can be moved to the `Role` table for tenant-managed policy.
- Mutations use server actions and API routes, with Prisma ready for audit logging and row-level scoping.
