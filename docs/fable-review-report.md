# Adversarial review of the Opus reconciliation (claude/impact-integration)

Branch: `claude/impact-review` (off `claude/impact-integration`). Nothing touched `main`, no PR, no migrations, no deploy.

## 1. Merge verification — clean, with one behavioral change nobody mentioned

Diffed both merge commits against each parent, file by file.
- Every hunk `fix/dashboard-truth` introduced is present after merge 1. The three hand-resolved files (`apps/agency/lib/signals/actions.ts`, `packages/db/src/signals/import-repository.ts`, `import-supabase.ts`) contain both sides' changes.
- Every file the quote branch added is byte-identical after merge 2; the shared files (middleware, navigation, indexes, package.json) carry both sides.
- `package-lock.json` is in sync with the manifests (`npm install --package-lock-only` produces no diff).
- No migration was dropped. `pipeline_artifacts` is defined identically in `deploy-release-production.sql` and `deploy-v0.3.0-pipeline.sql`; `users`, `tenants`, `scout_*`, `opportunity_*` duplicates are all `IF NOT EXISTS` and consistent.
- Route auth is unchanged relative to each parent; `/api/quotes/import` requires `IMPACT_INGEST_SECRET` like the other ingest routes.

**Production is now confirmed, not inferred.** Vercel's production deployment is `ba6861d` ("Fix duplicate text in outreach drafts and add refresh action", branch `main`). That message matches `32e7215` on `reconcile/production-lineage`, and `origin/main` now points at the older `be0b5ab`, so `main` was rewritten after the deploy. ADR 0001's inference was right.

**Behavioral change the Opus report missed:** production (`32e7215`) has a daily Vercel cron (`0 11 * * *` → `/api/automation/run`) in `vercel.json`. Commit `9b383a9` ("Keep automation cron disabled pending production review") removed it, and the integration branch inherits that. Shipping the integration branch silently stops the daily automation run. That may be intended, but Gino should decide it, not inherit it.

## 2. Security findings, ranked

1. **Open self-signup into ninety two's tenant (high, pre-existing, not introduced by the merge).** `/signup` is a public path. `signUpAction` (`apps/agency/lib/auth/actions.ts:97-180`) in "join" mode with an empty `tenant_slug` resolves to the `ninety-two` tenant, then uses the admin client to set `email_confirm: true`, so no email confirmation is required. The new user is a `bd_rep` in ninety two and can read every opportunity, contact, quote and draft. The production hostname is in the source (`impact.weareninetytwo.xyz`) and the repo is public. The only thing that might be stopping this today is `IMPACT_BASIC_AUTH_PASSWORD`, if it is set in Vercel; I could not verify. **Fix (needs Gino's go-ahead, it changes production behavior):** require an invite code or allow-listed email domain for join mode, or disable join mode entirely; stop auto-confirming email. "Create organization" mode also lets anyone create unlimited tenants.
2. **Session tenant is mostly ignored by the data layer (high for Phase 2, latent today).** `getRequestContext()` resolves the user's tenant, but only `fetchDashboardStats`, `fetchPendingImportCount` and opportunity creation pass it down. Quotes, scout, knowledge, pipeline, opportunity-watch all read `getTenantId()`, which is always ninety two. A user whose `app_metadata.tenant_id` is tenant B sees ninety two's data on most pages. Phase 0 made this explicit without wiring the request context into the resolver, which is correct for Phase 0 but means the seam is not yet "swappable" in practice.
3. **`/api/health` is public and leaks diagnostics (medium).** It is in `API_PUBLIC_PATHS` (since `67893d9`) while its own comment claims basic-auth protection. Unauthenticated callers get the Supabase project host, the key format, and raw database error messages. Fix: drop `keyHint`, `urlHost` and `detail` unless basic auth verifies, or remove it from the public list. Touches whatever uptime monitor reads it, so I did not change it.
4. **Secrets accepted in query strings (medium).** `/api/scout/run`, `/api/opportunity-watch/run`, `/api/automation/run` accept `?secret=`. Those land in Vercel request logs and browser history. The code comment already calls it legacy; it should be removed once the cron caller is confirmed to send the header.
5. **Automation route triggers the full pipeline on GET with one shared secret (medium).** Anyone with `IMPACT_SCOUT_SECRET` or `CRON_SECRET` can run Scout, draft outreach and create tasks at will, with `senderName: "Gino"` hardcoded. No rate limit, no idempotency key, no audit of who called. Fine for one tenant; a per-tenant token (ADR 0003) must land before any outside customer.
6. **Prompt injection surface is small today (low).** The only Claude call is `apps/agency/lib/quotes/draft.ts`. Inputs are quote fields, which arrive via the authenticated UI or the ingest-secret API, not from scraped pages. Output is structured JSON and rendered through React, and the human still sends. The real exposure arrives when Scout text (RSS, Google News, raw HTML) is fed to an LLM for research or drafting; none of the automation engines do that yet. ADR 0009's "scraped content is data, never instructions" needs to become code (delimit, strip, cap length, keep human approval) before that step.
7. **Non-constant-time secret comparisons (low).** `===` in `ingest-auth.ts`, `scout-auth.ts`, `automation-auth.ts`, `middleware.ts`. Impractical to exploit over Vercel, cheap to fix with `timingSafeEqual`.
8. **Redaction was incomplete (low, public repo).** The redaction commit removed dollar figures and partner names but left the client and bid identifiers (`SUNY Morrisville RFP 25-12`, deadline) in four docs and a named individual in `scripts/production-bridge-test.json`. I removed the person's name (commit `0ef1107`). The bid is a public procurement, so I left the rest for Gino to decide; making the repo private remains the real fix.

## 3. ADRs: agree / disagree / change

| ADR | Verdict | Strongest counter-argument |
|---|---|---|
| 0001 Base branch | **Change** | Mark production as confirmed (`ba6861d` ≈ `32e7215`) and record the cron removal as a deliberate decision, not an inheritance. |
| 0002 Tenancy | **Change** | The ADR frames the risk as "a missed `.eq` filter". The bigger hole is open signup into the default tenant, which no RLS design fixes. Also, "mint a short-lived tenant-scoped JWT for cron" means the server holds the project JWT secret, which is as powerful as the service role; it buys RLS enforcement but not least privilege. Prefer option 3 (`set_config('app.tenant_id')` via an RPC or a pooled connection with `SET LOCAL`) for background work, and option 2 for users. Add a cross-tenant integration test before any shared deployment. |
| 0003 Secrets | **Change** | Envelope encryption with a KMS is the right end state but is overbuilt for one pilot. Supabase Vault is adequate for the first outside customer. The urgent item buried in the ADR is the right one: per-tenant hashed, revocable API tokens replacing the three global bearer secrets. Promote that to the decision. |
| 0004 Packs in code, overrides in DB | **Agree**, with a correction | The report said scoring constants were "moved to config". Only fit, offers, keywords, value tiers, urgency tiers and weights moved. Confidence scoring (35/+15/+15/+15/+10/+10), grade thresholds (80/72/60, 64/55, 40, 35/35) and the tire-kicker phrases are still hardcoded in `scoring.ts`. The golden test still covers them, so this is a scope misstatement, not a bug. `ScoringInput.industry` has no caller, so the per-industry resolver is dead code until a second pack exists, which is fine. |
| 0005 Jobs table + cron | **Agree** | See Q4 below: the 60-second premise is wrong, which makes this option more viable, not less. |
| 0006 Mockups | **Agree** | Defer. |
| 0007 Email | **Agree** | Gmail draft scopes are "restricted" scopes and need Google verification plus possibly a CASA assessment before external users; budget months, not days. |
| 0008 Metering | **Agree** | |
| 0009 LLM gateway | **Change** | Fine as written, but add: scraped text must be passed as delimited data with a length cap and the model told it is untrusted; log prompt hashes not prompts. This should land before any Scout-to-LLM path, not after. |

## 4. Answers to the five questions

**Q1. Is app-layer filtering plus tenant-scoped JWTs safe for cron and ingest?** Not as described. A tenant-scoped JWT still has to be minted by code that holds the project JWT secret, so the server retains god-mode; RLS then enforces the tenant the server *chose*, which protects against forgotten filters but not against choosing the wrong tenant (the signup bug is exactly that). For background paths, derive the tenant from the credential presented (per-tenant API token → tenant id), never from a default, and set it on the connection (`SET LOCAL app.tenant_id` or an RPC wrapper). Remove `resolveDefaultTenantId()` fallbacks from every authenticated path.

**Q2. Does a request-scoped resolver work with server actions and Edge?** `AsyncLocalStorage` works in Next's Node runtime for route handlers and server actions (Next itself uses it for `headers()`/`cookies()`), and the Edge runtime exposes it too. The trap is where you *set* it: it must be entered inside each request (a wrapper around every action and handler), not in middleware, which runs in a separate invocation. Nothing in this repo opts into the Edge runtime today. Keep `getTenantId()` synchronous and back it with `AsyncLocalStorage.getStore()`; throw, don't default, when there is no store in production.

**Q3. Should the golden test pin quirky behavior or only grades?** Pin everything, for now. Its job is to make the refactor provably behavior-preserving, and quirks are behavior ninety two has been operating on. The moment someone wants to *change* scoring, split it: keep a small, readable set of grade-level invariants as the permanent contract, and regenerate the hash deliberately per pack version. I replaced the one vacuous assertion and added direct offer-routing checks (commit `2c664f3`).

**Q4. Is a Postgres jobs table plus cron enough under a 60-second limit?** The premise is stale. With Fluid Compute the Node runtime defaults to 300 s on every plan and Pro can set `maxDuration` up to 800 s; only legacy projects keep 60 s, and this project already declares `maxDuration = 120` on the automation route, so it is not on the 60-second ceiling. A cron-triggered drainer that claims small batches with `FOR UPDATE SKIP LOCKED`, marks progress per job, and exits before its own budget is adequate well past the first few customers. The real constraints are idempotency and per-source rate limits, not duration.

**Q5. Is there buyer evidence for the vertical hypothesis?** No. The brief and ADRs contain no interviews, letters of intent, prepayments or waitlist. The only external signal in the conversation is one acquaintance who sells glassware ad spots and "will purchase"; that is a referral channel, not evidence for territory-and-industry pricing of an openings feed. The brief's own Phase 1 gate (about 30 outreach messages → at least 2 quotes, run manually for ninety two) is the right next step and costs no code. Until it passes, every ADR above is speculative.

## 5. Changes made on this branch
- `2c664f3` test: explicit grade and offer assertions in the golden test.
- `0ef1107` chore: remove a named contact from a public fixture.

Everything else above is a finding for Gino to decide.
