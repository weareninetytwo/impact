# Epic 3D: Opportunity Watch Runner

**Status:** Ready for testing (manual runs only — cron disabled)

## Problem

The daily ChatGPT Opportunity Watch **task** posts updates inside ChatGPT. Those chat messages do **not** call Impact unless a GPT Action or API request is made. Impact only received leads when:

- Custom GPT Action called `/api/signals/import`
- Manual import test
- Scout manual run
- Direct API POST

**Opportunity Watch Runner** moves daily discovery **into Impact** so new leads land in the review queue automatically — without relying on chat as the source of truth.

## Solution

```
Opportunity Watch Runner
  → enabled Scout sources (MVP)
  → normalize + dedupe
  → importSignalItems (mode=review)
  → signal_imports (pending)
  → /signals/review
```

Future: plug in OpenAI / Perplexity search when keys are configured. MVP uses Scout sources only.

## Auth compatibility (verified)

| Route type | Behavior |
|------------|----------|
| App pages (`/dashboard`, `/signals/*`) | Supabase Auth session required |
| `POST /api/signals/import` | Bearer `IMPACT_INGEST_SECRET` — **no browser login** |
| `POST /api/opportunity-watch/import` | Bearer `IMPACT_INGEST_SECRET` — **no browser login** |
| `GET /api/scout/run` | Bearer `IMPACT_SCOUT_SECRET` — **no browser login** |
| `GET /api/opportunity-watch/run` | Bearer `IMPACT_SCOUT_SECRET` — **no browser login** |

Middleware `API_PUBLIC_PATHS` bypasses session auth for all token routes above.

GPT ingest still defaults to `mode=review` → `signal_imports` → `/signals/review`.

## Database

Run in Supabase SQL Editor:

`packages/db/supabase/deploy-v0.2.9-opportunity-watch.sql`

Creates `opportunity_watch_runs` for top-level run history (Scout runs still recorded in `scout_runs`).

## Environment

| Variable | Purpose |
|----------|---------|
| `IMPACT_INGEST_SECRET` | Bearer for import endpoints (GPT Actions) |
| `IMPACT_SCOUT_SECRET` | Bearer for run/cron endpoints (Scout + Opportunity Watch) |
| `OPENAI_API_KEY` | Optional — future automated AI search (not used in MVP) |
| `PERPLEXITY_API_KEY` | Optional — future research provider (not used in MVP) |

## API

### Run Opportunity Watch (automation / cron)

```bash
curl "https://impact.weareninetytwo.xyz/api/opportunity-watch/run" \
  -H "Authorization: Bearer YOUR_IMPACT_SCOUT_SECRET"
```

Response:

```json
{
  "run": {
    "id": "...",
    "status": "success",
    "sources_run": 2,
    "found_count": 15,
    "queued_count": 3,
    "skipped_count": 12,
    "started_at": "...",
    "finished_at": "..."
  },
  "scout_errors": []
}
```

### Import via Opportunity Watch endpoint (GPT Action)

```bash
curl -X POST https://impact.weareninetytwo.xyz/api/opportunity-watch/import \
  -H "Authorization: Bearer YOUR_IMPACT_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "import_source": "gpt",
    "items": [{ "company_name": "...", "opportunity_title": "...", "signal_type": "rfp" }]
  }'
```

Same payload and behavior as `POST /api/signals/import`. Dedicated path for Opportunity Watch GPT configuration.

## UI

| Route | Purpose |
|-------|---------|
| `/signals/opportunity-watch` | Run now, last run, sources, pending count, recent imports |
| `/signals/review` | Approve / skip queued signals |
| `/signals/scout` | Configure sources used by the runner |
| `/dashboard` | Pending signals + last Watch run widgets |

### Dashboard widgets

- **Pending signals** → links to review queue
- **Last Watch** → queued count + timestamp → links to Opportunity Watch page

## ChatGPT vs Impact

| Method | Creates review queue rows? |
|--------|---------------------------|
| Daily ChatGPT **task** (chat only) | **No** — unless Action calls API |
| GPT Action → `/api/opportunity-watch/import` | **Yes** |
| **Run Opportunity Watch** in Impact | **Yes** |
| Scout manual run | **Yes** |
| Cron → `/api/opportunity-watch/run` | **Yes** (when enabled) |

**Opportunity Watch Runner becomes the source of truth** for scheduled discovery inside Impact.

## Cron (disabled until manual tuning passes)

Do **not** enable until Scout + Watch quality is verified for several days.

When ready, add to root `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/opportunity-watch/run",
      "schedule": "0 14 * * *"
    }
  ]
}
```

Requires `IMPACT_SCOUT_SECRET` in Vercel Production. Configure cron to send `Authorization: Bearer $IMPACT_SCOUT_SECRET`.

## Prerequisites

1. Scout sources configured (`/signals/scout` → Add presets → enable feeds)
2. SQL migrations through `deploy-v0.2.9-opportunity-watch.sql`
3. Enterprise auth deployed (optional for UI; API routes unaffected)

## Exit criteria

- [ ] Click **Run Opportunity Watch** → new rows in `/signals/review`
- [ ] GPT Action on `/api/opportunity-watch/import` still works
- [ ] `/api/signals/import` unchanged
- [ ] Token routes bypass browser auth (401 without Bearer, 200 with secret)
- [ ] Dashboard shows pending signals + last run
- [ ] Cron route exists but **not enabled** in vercel.json
- [ ] Chat-only task updates documented as insufficient

## Next

- Wire GPT Action to `/api/opportunity-watch/import` (replace chat-only task)
- Epic 4 Intelligence Engine on approved signals
- AI search providers when `OPENAI_API_KEY` / `PERPLEXITY_API_KEY` configured
- Strategy-based sources (Epic 4.4)
