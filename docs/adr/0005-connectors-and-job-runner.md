# 0005 — Connector architecture and job runner

**Status:** Proposed

## Context
Scout, Opportunity Watch and automation run as Vercel functions limited to 60 seconds, triggered by cron or by a user. Fetching many sources per tenant will exceed that.

## Options
1. Keep long loops inside route handlers. Breaks at scale.
2. Hosted queue/workflow (Inngest, Trigger.dev, QStash). Retries, fan-out, observability. New vendor and cost.
3. **A `jobs` table in Postgres** (tenant_id, kind, payload, status, run_after, attempts, last_error), drained by a cron-triggered handler that claims small batches with `FOR UPDATE SKIP LOCKED`.
4. A dedicated worker host. Most control, most ops.

## Decision
Option 3 first. Each connector implements one interface (`fetch(tenantConfig, cursor) → signals[]`, plus `id`, rate limit and terms notes). One job per tenant per source, idempotent, with a dedupe key. Move to option 2 when job volume or retry needs outgrow it.

## Consequences
- Idempotency is mandatory, since cron retries will duplicate work.
- Per-source rate limits and robots/ToS compliance live in the connector, not the runner.
- Jobs must record tenant and cost for ADR 0008.
