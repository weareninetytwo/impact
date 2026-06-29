# Epic: Enterprise Auth & Teams

**Status:** Ready for setup

## Purpose

Replace the demo placeholder (`Demo User` / `Supabase` badge) with real Supabase Auth, organization accounts, and lead ownership — the foundation for multi-tenant SaaS (ninety two pays like any other customer).

## What shipped

| Feature | Description |
|---------|-------------|
| **Sign in** | `/login` — email + password |
| **Sign up** | `/signup` — join team (slug) or create new org |
| **Session** | Real name, role, org in header + sign out |
| **Lead ownership** | `owner_user_id` on opportunities |
| **My leads / Team** | Filter on `/opportunities?scope=mine\|team` |
| **Settings** | Account, team roster, workspace info |
| **Middleware** | Protected routes; public API ingest unchanged |

## Database

Run in Supabase SQL Editor after `deploy-v0.2.7-scout.sql`:

`packages/db/supabase/deploy-v0.2.8-enterprise-auth.sql`

Creates `users` table, `owner_user_id` on opportunities/imports, tenant billing placeholders.

## Supabase Dashboard setup (required)

1. **Authentication → Providers → Email** — enable Email provider
2. **Authentication → URL Configuration**
   - Site URL: `https://impact.weareninetytwo.xyz`
   - Redirect URLs:
     - `https://impact.weareninetytwo.xyz/auth/callback`
     - `http://localhost:3000/auth/callback`
3. **Optional:** disable email confirmation for internal MVP (Authentication → Providers → Email → Confirm email off) — re-enable for production SaaS

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Already set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already set — used for browser/server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set — signup metadata + admin |
| `IMPACT_DEFAULT_TENANT_SLUG` | Default org for join signup (default: `ninety-two`) |

## First-time setup (ninety two team)

1. Run SQL migration `deploy-v0.2.8-enterprise-auth.sql`
2. Configure Supabase Auth URLs (above)
3. Go to `/signup`
4. **Join existing team** — slug `ninety-two`
5. Create your account (first user can be promoted to `owner` in DB if needed)
6. Invite teammates — they sign up with same slug
7. **Optional:** remove or unset `IMPACT_BASIC_AUTH_PASSWORD` on Vercel (Supabase Auth replaces it)

## Lead visibility model

| Scope | Behavior |
|-------|----------|
| **Team** (default) | All opportunities in your organization |
| **My leads** | Only rows where `owner_user_id` = your user id |

New opportunities you create are assigned to you. GPT/Scout imports remain unassigned until approved (future: assign on review).

Team members can view each other's leads via **Team** tab — nothing is hidden by default except when filtering to **My leads**.

## Roles

| Role | Intended use |
|------|----------------|
| `owner` | Org creator, billing, invites |
| `admin` | Full pipeline access |
| `bd_rep` | Default — own + team leads |
| `viewer` | Read-only (future enforcement) |

Stored in `users.role` and JWT `app_metadata.role`.

## SaaS readiness

- Every row remains `tenant_id` scoped
- **Create new organization** on signup provisions a new tenant
- `tenants.plan` / `billing_status` placeholders for Stripe later
- ninety two uses slug `ninety-two`; other agencies get isolated tenants

## API routes (unchanged)

- `POST /api/signals/import` — Bearer token, no browser session
- `GET /api/scout/run` — cron secret

GPT daily scrape continues to queue into `/signals/review` regardless of who is logged in.

## Exit criteria

- [ ] No "Demo User" or "Supabase" badge in header when logged in
- [ ] Sign up + sign in works on production
- [ ] Team members share pipeline; My leads filter works
- [ ] Settings shows account + team list
- [ ] SQL migration applied

## Next

- Email invites with magic links
- Role-based UI restrictions
- Assign owner on signal approve
- Stripe billing per tenant
- Epic 4 Intelligence Engine
