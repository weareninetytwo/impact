# 0002 — Tenancy enforcement

**Status:** Proposed

## Context
Every table has RLS keyed on `auth.jwt() -> 'app_metadata' ->> 'tenant_id'`. The server uses the service-role key, which bypasses RLS, so isolation today is only the `.eq("tenant_id", …)` in app code, and that value was hardcoded to ninety two in about 15 files. Automation routes use global bearer secrets. One missed filter leaks one customer's data to another.

## Options
1. **App-layer filtering only**, behind one resolver. Cheapest. A single forgotten filter is a breach.
2. **Per-request Supabase client with the user's JWT**, so RLS enforces tenancy. Strongest. Needs user sessions on every path, so cron, ingest and Scout need a different mechanism.
3. **Service role plus a per-request Postgres setting** (`set_config('app.tenant_id', …)`) and RLS policies reading it. Works for cron and ingest; needs a transaction-scoped connection, which supabase-js does not offer directly.
4. Schema or database per tenant. Strong isolation, heavy ops. Reserve for enterprise.

## Decision
- **Phase 0 (done):** all reads and writes go through `getTenantId()` in `@impact/shared`, a swappable resolver. A test fails if any file reads `DEFAULT_TENANT_ID` directly.
- **Before the second customer:** option 2 for user-driven paths. For cron and ingest, mint a short-lived tenant-scoped JWT (signed with the project JWT secret) and use the normal client so RLS applies. The service role is kept only for admin tasks and migrations.
- Pilots may run as **separate deployments** until this lands, which makes option 1 acceptable.

## Consequences and risks
- `getTenantId()` is synchronous. Phase 2 needs request scoping, likely `AsyncLocalStorage`; the signature stays the same, but verify it on Vercel's Node runtime.
- Add a cross-tenant test (tenant A cannot read tenant B) to CI before any shared deployment.
- Resolver state is module-global, so it must never be set per request in a long-lived process. Use `AsyncLocalStorage` instead.
