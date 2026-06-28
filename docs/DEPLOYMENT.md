# Deploy Impact v0.2 (Vercel + Supabase)

Mobile-accessible internal MVP for ninety two.

## Live

| | |
|---|---|
| **Production URL (Vercel)** | https://impact-rosy.vercel.app |
| **Recommended internal URL** | https://impact.weareninetytwo.xyz |
| **Vercel project** | [getforge/impact](https://vercel.com/getforge/impact) |
| **Status** | 🟢 **v0.2 live** — mobile, cloud, Supabase, basic auth |

> Keep `IMPACT_BASIC_AUTH_PASSWORD` enabled. This is an internal tool, not the public ninety two marketing site.

> **Do not start Epic 3 until v0.2 is verified on phone + desktop.** Epic 2.5 (Knowledge Engine) comes before Signal Engine.

---

## Security (read before adding env vars)

| Variable | Where it runs | Rule |
|----------|---------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Safe to expose (RLS applies when enabled) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Legacy **service_role** JWT (`eyJ...`) or Secret key (`sb_secret_...`). Never prefix with `NEXT_PUBLIC_`. Server actions only via `@impact/db` → `createServerClient()` |
| `SUPABASE_URL` | **Server only** | Optional runtime override for Supabase Project URL (`https://xxx.supabase.co`). Prefer this over relying on build-time `NEXT_PUBLIC_*` inlining |
| `IMPACT_BASIC_AUTH_PASSWORD` | Server (middleware) | Use a **strong, unique password** (20+ chars). Not shared in chat or committed to git |

**Verified in codebase:** `SUPABASE_SERVICE_ROLE_KEY` is read only in `packages/db/src/client.ts` (`createServerClient`) and consumed by `supabase-store.ts`. All writes go through `"use server"` actions in `apps/agency/lib/opportunities/actions.ts`.

---

## Prerequisites

- [Supabase](https://supabase.com) project (free tier works)
- [Vercel](https://vercel.com) account
- Git repo pushed to GitHub

---

## Step 0 — Push to GitHub

**Status:** Committed locally (`deploy impact v0.2`). No remote yet — do this now.

1. Go to [github.com/new](https://github.com/new)
2. Repository name: **`impact`**
3. **Do not** add README, `.gitignore`, or license (empty repo)
4. Create repository → copy the HTTPS URL

```bash
cd "/Users/ginobroccolo/Downloads/CURSOR/IMPACT–NINETY TWO"
git remote add origin https://github.com/YOUR_ORG/impact.git
git branch -M main
git push -u origin main
```

Replace `YOUR_ORG` with your GitHub username or org (e.g. `getforge`).

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

## Step 3 — Connect GitHub to Vercel + env vars

### Import repo (or link existing project)

1. [Vercel → Add New Project](https://vercel.com/new) → Import **`YOUR_ORG/impact`**
   - Or link the repo to existing [getforge/impact](https://vercel.com/getforge/impact): Settings → Git → Connect
2. **Root Directory:** `apps/agency`
3. **Enable:** “Include source files outside of the Root Directory” (required for `@impact/db`, `@impact/shared`, `@impact/engines`)
4. Framework: Next.js (auto-detected)

### Add env vars (Production)

[Vercel → impact → Settings → Environment Variables](https://vercel.com/getforge/impact/settings/environment-variables)

```
SUPABASE_URL=                    # optional; server-only Project URL
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # legacy service_role JWT (eyJ...) recommended
IMPACT_BASIC_AUTH_PASSWORD=   # strong password — 20+ chars, unique
```

### Deploy

Click **Deploy** (first Git import) or **Redeploy** after adding env vars.

Production URL: **https://impact-rosy.vercel.app** (or the alias Vercel assigns).

### Or via CLI (after env vars are set)

```bash
cd "/Users/ginobroccolo/Downloads/CURSOR/IMPACT–NINETY TWO"
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

Only after all checks pass → v0.2 is live.

---

## Step 6 — Custom domain (recommended)

Use a **subdomain**, not a path on the main ninety two site.

| Use | Don't use |
|-----|-----------|
| `https://impact.weareninetytwo.xyz` | `https://weareninetytwo.xyz/impact` |

**Why subdomain, not path:**

- Cleaner internal tool URL
- Easier Vercel setup (no reverse-proxy rewrites on the marketing site)
- SaaS-ready architecture — later move to `app.useimpact.com` without rebuilding
- Avoids conflicts with the main ninety two website
- Keeps Impact clearly separate while password-protected

**Do not** put Impact on the root domain (`weareninetytwo.xyz`) yet. Keep it internal with basic auth.

### Add domain in Vercel

1. [Vercel → impact → Settings → Domains](https://vercel.com/getforge/impact/settings/domains)
2. Add **`impact.weareninetytwo.xyz`**
3. Vercel shows a **CNAME** target (e.g. `cname.vercel-dns.com`)
4. In your DNS provider (where `weareninetytwo.xyz` is managed), add:

   | Type | Name | Value |
   |------|------|-------|
   | CNAME | `impact` | *(value Vercel provides)* |

5. Wait for DNS propagation (minutes to a few hours)
6. Keep **`IMPACT_BASIC_AUTH_PASSWORD`** enabled in Production env vars
7. Verify **mobile and desktop** after the domain shows **Valid** in Vercel

### Future product domain

When ready for external/SaaS use, point a dedicated domain (e.g. `app.useimpact.com`) the same way — swap DNS, no app rebuild required.

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
| Empty opportunities after deploy | Check `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel (use legacy `service_role` JWT if `sb_secret_` fails) |
| Invalid API key / Supabase error | Re-copy full **service_role** JWT from Supabase → Legacy API Keys; redeploy |
| Cannot reach Supabase | Set `SUPABASE_URL` to `https://xxx.supabase.co` (Project URL from Settings → API, not dashboard browser URL) |
| 401 on every page | Enter basic auth credentials; check `IMPACT_BASIC_AUTH_PASSWORD` |
| Build fails on Vercel | Deploy from monorepo root; `vercel.json` at repo root builds `@impact/agency` |
| SQL error on deploy script | Run `deploy-v0.2.sql` only (not partial migrations) |

### Desktop not loading (mobile works)

If the phone loads but desktop does not, it's usually cache or basic auth — not the app itself.

**Fast checks (in order):**

1. **Incognito / private window** on desktop
2. **Another browser** (Chrome vs Safari vs Firefox)
3. **Hard refresh:** `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
4. **Clear site data** for `impact-rosy.vercel.app` (or your custom domain) — cookies + cached auth
5. **Same exact URL** as phone (including `https://`)
6. If login prompts repeat: browser cached a bad basic-auth response — incognito or clear site data fixes it
7. Check for **ad blocker / privacy extensions** blocking auth headers
8. [Vercel → Deployments → Logs](https://vercel.com/getforge/impact) — look for 500/404 on desktop requests
9. Confirm all env vars exist for **Production** (not Preview only)

**Basic auth tip:** Username can be anything; only the password must match `IMPACT_BASIC_AUTH_PASSWORD`.

Diagnostic (after login): `https://impact-rosy.vercel.app/api/health` — should show `"supabase":"ok"`.

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
- Knowledge Engine (Epic 2.5)
- Signal importers (Epic 3 — **NIN-6**)
- AI agents

**Next epic:** Knowledge Engine (Epic 2.5) — then Signal Importer + source documents (NIN-6).
