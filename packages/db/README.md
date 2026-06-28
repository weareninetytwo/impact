# Database

## Persistence modes

| Mode | When | Storage |
|------|------|---------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set | `opportunity_records` table |
| **File** | Fallback (local dev) | `apps/agency/data/opportunities.json` |

## Deploy v0.2 (Supabase SQL Editor)

Run the entire file in one query:

```
packages/db/supabase/deploy-v0.2.sql
```

Creates `tenants` (with ninety two seed) and `opportunity_records`.

## Incremental migrations

For full schema evolution, run in order:

1. `20260627000001_phase1_foundation.sql`
2. `20260627000002_phase2_engines.sql` (optional for v0.2)
3. `20260628000001_epic2_opportunity_intake.sql` (legacy opportunities table)
4. `20260628000002_opportunity_records.sql` (same as deploy script table)

**v0.2 MVP only needs `deploy-v0.2.sql`.**

## Environment variables

See root [`.env.example`](../../.env.example) and [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).
