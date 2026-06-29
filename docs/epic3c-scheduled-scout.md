# Epic 3C: Scheduled Scout MVP

**Status:** Ready for testing

## Purpose

First autonomous source monitor for Impact. Scout fetches configured sources (RSS, basic HTML, manual query stubs), normalizes findings into the existing signal ingest shape, and **queues them for review** — same path as GPT imports (`mode: review`, `import_source: scraper`).

Nothing bypasses `/signals/review`.

## Flow

```
Scout source (RSS / HTML / manual query)
  → fetch + normalize
  → importSignalItems (review + scraper)
  → signal_imports (pending)
  → /signals/review
  → Approve | Merge | Skip
```

Manual run: **Run Scout** on `/signals/scout`  
Scheduled run (optional): `GET /api/scout/run` via Vercel Cron + `IMPACT_SCOUT_SECRET`

## Database

Run in Supabase SQL Editor after `deploy-v0.2.6-signal-imports.sql`:

`packages/db/supabase/deploy-v0.2.7-scout.sql`

Creates:

| Table | Purpose |
|-------|---------|
| `scout_sources` | Configured monitors per tenant |
| `scout_runs` | Run history (found / queued / skipped counts) |

## Source types (MVP)

| Type | Behavior |
|------|----------|
| `rss` | Fetch and parse RSS/Atom feed (up to 25 items) |
| `html` | Fetch page title, meta description, limited link extraction |
| `manual_query` | Builds Google News RSS URL from `query` field |
| `stub` | Placeholder — run fails with guidance (SAM.gov, Apollo) |

## Presets

Use **Add presets** on `/signals/scout`:

| Preset | Type | Notes |
|--------|------|-------|
| NYSCR — NY public RFP search | `manual_query` | Google News RSS proxy until NYSCR API wired |
| SAM.gov — federal opportunities | `stub` | Disabled by default |
| Google News — expansion signals | `rss` | NY expansion keywords |
| Apollo — export / manual source | `stub` | Disabled by default |

## UI

| Route | Purpose |
|-------|---------|
| `/signals/scout` | Configure sources, Run Scout, view run history |
| `/signals/review` | Approve queued scout signals |
| `/signals` | Link to Scout |

### Actions

- **Add presets** — seed default sources (skips duplicates by name)
- **Run Scout** — run all enabled sources
- **Run source** — run one source
- Toggle **Enabled** per source

## Cron route (enable later)

```bash
curl "https://impact.weareninetytwo.xyz/api/scout/run" \
  -H "Authorization: Bearer YOUR_IMPACT_SCOUT_SECRET"
```

Or query param (for manual testing only):

```bash
curl "https://impact.weareninetytwo.xyz/api/scout/run?secret=YOUR_IMPACT_SCOUT_SECRET"
```

### Vercel Cron (when ready)

1. Set `IMPACT_SCOUT_SECRET` in Vercel env (Production).
2. Add to root `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scout/run",
      "schedule": "0 14 * * *"
    }
  ]
}
```

3. Configure Vercel Cron to send `Authorization: Bearer $IMPACT_SCOUT_SECRET` (or use Vercel's cron secret header pattern documented in Vercel dashboard).

Cron is **not enabled by default** — route exists but requires secret.

## Environment

| Variable | Scope | Description |
|----------|-------|-------------|
| `IMPACT_SCOUT_SECRET` | Server | Bearer token for `GET /api/scout/run` |

Add to `apps/agency/.env.local` and Vercel when enabling cron.

## Deduping

Scout skips items whose `source_url` already exists in **pending** `signal_imports` for the tenant.

## Out of scope (Epic 3C)

- Broad site scraping / headless browsers
- SAM.gov API, NYSCR authenticated search, Apollo CSV ingest
- Direct pipeline bypass (`mode: direct`)
- Fit scoring beyond basic signal_type inference

## Exit criteria

- [x] User can configure a scout source
- [x] User can manually run Scout
- [x] Scout queues signals into `/signals/review`
- [x] Scout run history is visible
- [x] Cron route exists (enable with secret + vercel.json)

## Next (Epic 4)

Scout + Analyst Engine — PDF extraction, Knowledge fit scoring, win probability, outreach drafts.
