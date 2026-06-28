# Deploy Impact v0.2 (Vercel + Supabase)

Mobile-accessible internal MVP for ninety two.

## Live (partial)

| | |
|---|---|
| **Production URL** | https://impact-rosy.vercel.app |
| **Vercel project** | [getforge/impact](https://vercel.com/getforge/impact) |
| **Status** | App deployed — **finish Supabase + env vars below** |

> **Important:** Until env vars are set, the site is public (no password) and opportunities **do not persist** on Vercel. Complete Steps 0–3 below (~10 min).

> **Do not start Epic 3 (Signal Engine / NIN-6) until v0.2 is live and verified.** We need a working baseline first.

---

## Security (read before adding env vars)

| Variable | Where it runs | Rule |
|----------|---------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Safe to expose (RLS applies when enabled) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Never prefix with `NEXT_PUBLIC_`. Never import in client components. Used only in server actions via `@impact/db` → `createServerClient()` |
| `IMPACT_BASIC_AUTH_PASSWORD` | Server (middleware) | Use a **strong, unique password** (20+ chars). Not shared in chat or committed to git |

**Verified in codebase:** `SUPABASE_SERVICE_ROLE_KEY` is read only in `packages/db/src/client.ts` (`createServerClient`) and consumed by `supabase-store.ts`. All writes go through `"use server"` actions in `apps/agency/lib/opportunities/actions.ts`.

---

## Prerequisites

- [Supabase](https://supabase.com) project (free tier works)
- [Vercel](https://vercel.com) account
- Git repo pushed to GitHub

---

## Step 0 — Commit and push

```bash
git add .
git commit -m "deploy impact v0.2"
git push
```

Connect the GitHub repo to [getforge/impact](https://vercel.com/getforge/impact) for automatic deploys on push (optional but recommended).

---

## Step 1 — Supabase database

1. Create a Supabase project
2. Open **SQL Editor → New query**
3. Paste and run the entire contents of:

   `packages/db/supabase/deploy-v0.2.sql`

4. Confirm tables exist: **Table Editor → `tenants`, `opportunity_records`**

---

## Step 2 — Supabase API keys

1. **Project Settings → API**
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3 — Vercel env vars + redeploy

**Already done:** Impact is deployed at https://impact-rosy.vercel.app (monorepo root + root `vercel.json`).

**You still need:** Add env vars, then redeploy.

### Add env vars (Dashboard)

1. [Vercel → getforge/impact → Settings → Environment Variables](https://vercel.com/getforge/impact/settings/environment-variables)
2. Add for **Production** (and Preview if you want):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   IMPACT_BASIC_AUTH_PASSWORD=   # strong password — 20+ chars, unique
   ```

3. **Redeploy:** Deployments → latest → ⋮ → Redeploy

### Or via CLI

```bash
cd "/path/to/impact"
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add IMPACT_BASIC_AUTH_PASSWORD production
npx vercel deploy --prod --yes
```

---

## Step 4 — Access from phone

1. Open **https://impact-rosy.vercel.app** on your phone
2. Browser prompts for login:
   - **Username:** anything (e.g. `gino`)
   - **Password:** your `IMPACT_BASIC_AUTH_PASSWORD`
3. Add to Home Screen (Safari → Share → Add to Home Screen) for app-like access

---

## Step 5 — Verify (including phone)

- [ ] Dashboard shows widget counts
- [ ] **From your phone:** create one test opportunity at `/opportunities/new`
- [ ] **In Supabase:** confirm that row appears in **Table Editor → opportunity_records**
- [ ] Settings shows **Persistence: Supabase (production)**
- [ ] Basic auth prompt appears before dashboard loads
- [ ] Works on mobile viewport (hamburger menu)

Only after all checks pass → v0.2 is live. Then start **NIN-6 Signal Engine**.

---

## Local dev with Supabase

```bash
cp .env.example apps/agency/.env.local
# fill in Supabase keys
npm install
npm run dev
```

Persistence mode shown in Settings header badge.

## Local dev without Supabase

Omit Supabase env vars — uses `apps/agency/data/opportunities.json`.

## Temporary LAN testing (not production)

```bash
npm run dev --workspace=@impact/agency -- --hostname 0.0.0.0
# phone on same WiFi: http://YOUR-LAPTOP-IP:3000
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty opportunities after deploy | Check `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel |
| 401 on every page | Enter basic auth credentials; check `IMPACT_BASIC_AUTH_PASSWORD` |
| Build fails on Vercel | Deploy from monorepo root; `vercel.json` at repo root builds `@impact/agency` |
| SQL error on deploy script | Run `deploy-v0.2.sql` only (not partial migrations) |

---

## What v0.2 includes

- Opportunity create / CSV import / paste import
- Deterministic scoring + dedupe
- Dashboard widgets
- Supabase persistence (when configured)
- Basic auth guard
- Mobile-responsive shell

## Not in v0.2 (build after deploy)

- Supabase Auth login UI
- Multi-user / multi-tenant switching
- Signal importers (Epic 3 — **NIN-6**)
- AI agents

**Next epic after go-live:** Signal Engine (NIN-6) — RFP links, source docs, and opportunity watch results flow into Impact.
