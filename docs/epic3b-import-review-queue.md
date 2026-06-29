# Epic 3B: Import Review Queue

**Status:** Ready for testing

## Purpose

Imported GPT/search/scraper leads no longer go straight into the live opportunity pipeline by default. They land in a **review queue** where you approve, merge, skip, or promote them on mobile.

## Flow

```
ChatGPT / API / scraper
  → POST /api/signals/import (mode=review, default)
  → signal_imports (pending)
  → /signals/review
  → Approve | Merge | Skip
  → Opportunity + linked source knowledge (on approve/merge)
```

**Direct mode** (`mode: "direct"`) keeps Epic 3A behavior for admin/testing.

## Database

Run in Supabase SQL Editor after `deploy-v0.2.5-knowledge.sql`:

`packages/db/supabase/deploy-v0.2.6-signal-imports.sql`

Creates `signal_imports` with status: `pending`, `approved`, `merged`, `skipped`.

## API

### Default (review queue)

```bash
curl -X POST https://impact.weareninetytwo.xyz/api/signals/import \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "import_source": "gpt",
    "items": [{ "company_name": "...", "opportunity_title": "...", "signal_type": "rfp" }]
  }'
```

Response includes `queued` and `signal_import_ids`.

### Direct (immediate pipeline)

```json
{
  "mode": "direct",
  "items": [...]
}
```

Same as Epic 3A — creates/updates opportunities + knowledge immediately.

## UI

| Route | Purpose |
|-------|---------|
| `/signals/review` | Pending imports — Approve / Merge / Skip |
| `/signals/import-test` | Manual test — uses `mode: direct` |
| `/dashboard` | Pending imports count (links to review) |
| `/signals` | Link to review queue |

### Review actions

| Action | Behavior |
|--------|----------|
| **Approve** | Create/update opportunity + source knowledge |
| **Merge** | Attach source knowledge to existing opportunity |
| **Skip** | Mark skipped — no pipeline change |

## Custom GPT

No endpoint change. GPT keeps calling `importSignals`. Default `mode=review` means imports queue until you approve on phone.

Optional: add `"import_source": "gpt"` to payloads in GPT instructions.

Re-import OpenAPI from `docs/openapi-impact-ingest.json` (v3B) if schema changed.

## Exit criteria

- [ ] GPT import creates pending `signal_imports` by default
- [ ] Pending import appears in `/signals/review`
- [ ] Approve creates opportunity + knowledge
- [ ] Merge attaches source knowledge to existing opportunity
- [ ] Skip prevents pipeline pollution
- [ ] Dashboard shows pending imports
- [ ] `mode: "direct"` still promotes immediately

## Next

- Epic 3B+: batch approve, duplicate detection in queue
- Epic 3C: scheduled scrapers → same ingest API → review queue
