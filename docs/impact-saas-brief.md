# Impact → SaaS: brief for the planning sessions

**Date:** 2026-10-17 · **Status:** draft handoff for the Opus and Fable planning sessions
**Owner:** Gino Broccolo · **Written by:** Claude, from a long strategy session. Where a claim comes from that session's research rather than from this repo, it is marked *(research)*. The research reports are not in the repo.

---

## 1. Goal

Turn Impact from ninety two's internal growth tool into a SaaS that flexes on **three axes**:

| Axis | Meaning |
|------|---------|
| **Customers** | Many isolated workspaces (multi-tenant) |
| **Industries** | Per-industry "packs": signals, scoring, offers, message templates |
| **Markets (cities)** | Per-customer markets, each with its own data sources |

**Working hypothesis for the wedge (unvalidated):** "a new business is opening" is a trigger many B2B vendors sell on (sign shops, insurance brokers, bookkeepers, payroll, payments, telecom, security, cleaning). Impact detects the opening, qualifies it, drafts a tailored outreach with a mockup, and runs the follow-up. Sold by **territory** and **industry**. The value is the workflow and the won deal, not the data.

## 2. Read this first: the repo has diverged

`main` is **not** the latest work. Do step 0 before anything else.

| Branch | vs `main` | What it holds |
|--------|-----------|---------------|
| `main` (`be0b5ab`) | — | Older baseline. Many modules are placeholders. |
| `reconcile/production-lineage` | +7 commits | Automation pipeline (research → outreach → proposal drafts), outreach draft queue, automation cron auth (cron kept disabled), some tests, ops scripts. 77 files changed. |
| `fix/dashboard-truth` | +1 commit | Tenant-scoped dashboard stats, `docs/roadmap/*` (CURRENT_STATE, NEXT_ACTIONS, CHANGELOG), `docs/handoffs/CURSOR_HANDOFF.md`, tests. **Not contained in `reconcile`; the two conflict in 5 files.** |
| `claude/quote-follow-up` | +1 commit | Quote follow-up on the Nurture page, `POST /api/quotes/import`, quotes SQL, optional Claude redraft. Conflicts with `reconcile` in 3 files (`nurture/page.tsx`, `engines/src/index.ts`, `.env.example`); merges cleanly with `fix/dashboard-truth`. |
| `claude/saas-brief` | +1 on the quote branch | This document only. |

**Unknown:** which commit production (Vercel project in `docs/roadmap/CURRENT_STATE.md`) actually runs. Verify before choosing the base.

**Gate to acknowledge:** `NEXT_ACTIONS.md` (on `fix/dashboard-truth`, dated 2026-07-01) lists *"SaaS packaging / multi-tenant sales"* under **"do not build until revenue case re-opened."** Gino stated on 2026-10-17 that he wants to pursue SaaS. The plan should record that decision explicitly and keep the validate-first sequencing below. `CURRENT_STATE.md` and `NEXT_ACTIONS.md` are about three months stale (they center on a July RFP deadline).

## 3. Current state (verified in code; re-verify on the reconciled base)

- **Stack:** Next.js 15 (`apps/agency`), Supabase, Vercel. npm workspaces: `packages/shared`, `packages/db`, `packages/engines`. CI runs typecheck and build only.
- **Persistence:** Supabase using the **service-role key on the server (bypasses RLS)**, with a JSON-file fallback when Supabase is not configured.
- **Tenancy:** a `tenants` table exists, and Supabase Auth puts `tenant_id` in `app_metadata`. **But the data layer hardcodes `DEFAULT_TENANT_ID` in ~15 files** (13 on `fix/dashboard-truth`, which added an optional `tenantId` to some reads). A second customer would see ninety two's data.
- **Automation auth:** global secrets (`IMPACT_INGEST_SECRET`, `IMPACT_SCOUT_SECRET`), not per tenant.
- **Industry coupling:** `packages/engines/src/scoring.ts` (`FIT_BY_SIGNAL`, `OFFER_BY_SIGNAL`) is specific to a branding/signage agency.
- **Scout:** source types `rss`, `html` (basic), `manual_query` (Google News RSS), `stub`. Quality is noisy per `CURRENT_STATE.md`. Many city permit portals will not fit these types.
- **Limits:** run routes use `maxDuration = 60`; cron is disabled; Gmail send is blocked pending OAuth; Apollo and SAM.gov are stubs; few tests; Claude does not generate images.
- **Quote follow-up:** tested end to end in a local browser (log quote, due queue, mark sent, won/lost, import API). The optional Claude redraft was **never run against the live API**.
- **Naming collision:** `CURRENT_STATE.md` calls the platform "0.3.0"; the quote SQL file is named `deploy-v0.3.0-quote-follow-up.sql`. Rename one.

## 4. Constraints and decisions to respect *(research)*

- **Crowded category** (Clay, Apollo, HubSpot, Common Room, UserGems and others). `docs/product-strategy.md` targets professional services; the current view is **vertical-first**.
- **Data alone doesn't sell.** Permit and filing data is already sold (about $599+/month for permits, $49–199/month for SEC data), and cheap permit scrapers on Apify had a median of about 1 user. Value must be the workflow and the outcome.
- **Base rates:** small-business SaaS loses about 3–7% of customers per month; the median verified solo product earns about $445/month.
- **Apollo's terms** (updated Aug 10, 2026) bar using Apollo data to offer a product or service to third parties. **Each customer brings their own Apollo/Clay/Gmail credentials. Impact never resells vendor data.**
- **Company-level data, US first.** Keep a human approval gate before anything is sent (an existing principle in `docs/`). No auto-send.
- **No branding, domain purchases or full builds before buyer-demand evidence.** A previously proposed product name was withdrawn.
- **Customer zero first.** ninety two proves the workflow before outsiders pay. The first outside pilots may run as separate deployments instead of waiting for multi-tenant.

## 5. Target design for the three axes

1. **Customers → workspaces.** Tenant resolved from the session everywhere; per-tenant, hashed, rotatable ingest/automation tokens; encrypted per-tenant secrets (BYO keys); roles; **automated cross-tenant leak tests**.
2. **Industries → packs.** A config schema covering signal types, scoring weights, offer catalog, outreach and follow-up templates, qualification questions, source presets and terminology. Extract today's branding-agency constants as pack #1; **signage as pack #2**.
3. **Cities → markets.** A market registry per tenant and a connector interface (fetch → normalize → dedupe → review queue). Connector types: open-data APIs (Socrata/ArcGIS-style), RSS, HTML, PDF/CSV. Source health monitoring. Start with 2–3 metros where design partners are.
4. **The openings workflow:** opening event → filter to storefront/signage-relevant → mockup → outreach draft (human approves) → quote → follow-up. Quote follow-up already exists on `claude/quote-follow-up`.

## 6. Proposed phases and exit criteria

| Phase | Work | Exit criterion |
|-------|------|----------------|
| **0. Reconcile + seam** (est. 1–3 days) | One base branch; one swappable `getTenantId()` that still returns ninety two; move scoring/offers into config (default = current branding pack); CI runs tests | Typecheck, lint, build and tests green; no behavior change for ninety two |
| **1. Prove it** (est. 2–4 weeks, mostly non-code) | Run the openings workflow for ninety two, manual first | Thresholds set **before** the pilot (suggestion: about 30 outreach messages → at least 2 quotes). Track hours per week, cost per win |
| **2. Multi-workspace** | Tenant isolation, per-tenant tokens/secrets, roles, invites, leak tests | Leak tests pass on every repository function and route |
| **3. Industry packs** | Config schema, pack #2 (signage) | A new industry is added by config, not code changes |
| **4. Markets** | Registry and connector interface, 2–3 cities | A new city in the same connector type is a config change |
| **5. Commercial** | Billing, onboarding, brand and domain | Only after 3 or more outsiders pay, or equivalent evidence |

## 7. Open decisions for the planning sessions

1. Base branch and merge order (see §2), and how to merge the quote Nurture page with the automation Nurture page.
2. Tenancy enforcement: filter in application code, or move to Postgres RLS with per-user JWTs (today's server bypasses RLS).
3. Per-tenant secret storage and key rotation.
4. Config storage for packs and markets: DB tables or versioned JSON; how a tenant overrides a pack.
5. Connector architecture and job runner (Vercel's 60-second function limit; cron or a queue).
6. Mockup generation: a separate image provider is needed; check its terms and cost per image. Street-level imagery has terms that restrict bulk use.
7. Email delivery: Gmail OAuth versus an email service; deliverability; CAN-SPAM. SMS and call recording need separate compliance review.
8. Pricing unit (hypothesis: per exclusive territory and industry rather than per seat) and cost model (LLM and image cost per opening).
9. Observability and cost controls for LLM calls.

## 8. Quality bar

- Cross-tenant leak tests for every repository function and API route.
- CI runs typecheck, lint, build **and tests**.
- Reviewed migrations; no production changes from a planning session; no secrets in the repo.

## 9. Non-goals for now

Billing, marketing site, new brand or domain, an "all industries" launch, connectors for more than 3 cities, native mobile apps.

## 10. Pointers

`docs/vision.md`, `docs/architecture.md`, `docs/product-strategy.md`, `docs/modules.md`, `docs/database.md`, `docs/epic5a-quote-follow-up.md`; on `fix/dashboard-truth`: `docs/roadmap/*`, `docs/handoffs/CURSOR_HANDOFF.md`.
