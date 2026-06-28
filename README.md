# Impact

**The Growth Operating System**

AI eliminates wasted sales time. Humans close qualified opportunities.

## Monorepo

```
impact/
├── apps/
│   └── agency/          # ninety two tenant app (Epic 1)
├── packages/
│   ├── shared/          # Types, constants, mock data
│   ├── db/              # Supabase client + SQL migrations
│   └── engines/         # AI engines placeholder (Epic 2+)
└── docs/                # Product documentation
```

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

## Environment

Copy `.env.example` to `apps/agency/.env.local` (or root `.env.local`) when connecting Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Epic 1 runs with mock data when Supabase is not configured.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start agency app |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check all workspaces |

## Database migrations

See [packages/db/README.md](./packages/db/README.md).

## Deploy (v0.2)

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Vercel + Supabase setup.

Quick: run `packages/db/supabase/deploy-v0.2.sql` in Supabase SQL Editor, set env vars on Vercel, deploy `apps/agency`.
