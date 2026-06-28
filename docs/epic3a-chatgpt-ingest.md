# Epic 3A: ChatGPT-to-Impact Ingest Bridge

**Status:** Ready for testing

## Purpose

Allow ChatGPT, Custom GPT Actions, Make/Zapier/n8n, or manual JSON paste to send opportunity-watch results directly into Impact — no copy/paste into CSV import.

## Flow

```
ChatGPT search / scrape
  → structured JSON
  → POST /api/signals/import (Bearer token)
  → Impact validates, dedupes, scores
  → source raw_text → Knowledge item (linked to opportunity)
  → review in /opportunities
```

## Setup

### 1. Vercel env var

Add to **Production** (and Preview if needed):

```bash
IMPACT_INGEST_SECRET=make-a-long-random-secret-at-least-32-chars
```

Redeploy after adding.

### 2. Test manually (fastest)

1. Open **Signals → Import test** (`/signals/import-test`)
2. Paste sample JSON (pre-filled)
3. Click **Import signals**
4. Check **Opportunities** and **Knowledge**

### 3. Test API

```bash
curl -X POST https://impact-rosy.vercel.app/api/signals/import \
  -H "Authorization: Bearer YOUR_IMPACT_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d @docs/sample-signal-ingest.json
```

Local:

```bash
curl -X POST http://localhost:3000/api/signals/import \
  -H "Authorization: Bearer YOUR_IMPACT_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"company_name":"Test Co","opportunity_title":"RFP","signal_type":"rfp","raw_text":"Sample"}]}'
```

### 4. Custom GPT Action

1. Create a Custom GPT
2. **Actions → Import from OpenAPI**
3. Upload `docs/openapi-impact-ingest.json`
4. Set **Authentication → API Key → Bearer** = your `IMPACT_INGEST_SECRET`
5. Server URL: `https://impact-rosy.vercel.app`

## Payload shape

```json
{
  "items": [
    {
      "company_name": "Northline Health",
      "opportunity_title": "Website redesign RFP",
      "signal_type": "rfp",
      "signal_summary": "Short summary",
      "source_name": "NYSCR",
      "source_url": "https://example.com/rfp/123",
      "deadline": "2026-08-15",
      "estimated_value": "125000",
      "location": "Albany, NY",
      "fit_score": 85,
      "fit_notes": "Optional notes",
      "recommended_action": "Optional override",
      "raw_text": "Full source text for Knowledge"
    }
  ]
}
```

## Behavior

| Step | Detail |
|------|--------|
| **Auth** | `Authorization: Bearer {IMPACT_INGEST_SECRET}` |
| **Dedupe** | `company_name + source_url`, or `company_name + opportunity_title` if no URL |
| **Scoring** | Runs scoring engine; uses `fit_score` from payload when provided |
| **Source docs** | `raw_text` or `source_url` → Knowledge item linked to opportunity |
| **Response** | `{ created, updated, skipped, errors, opportunity_ids, knowledge_ids }` |

## Non-goals (Epic 3A)

- Autonomous scraping (NYSCR, SAM.gov, etc.)
- Proposal generation
- OpenAI inside Impact (ChatGPT calls Impact, not the reverse)

## Exit criteria

- [ ] POST `/api/signals/import` creates opportunities with Bearer auth
- [ ] `/signals/import-test` works for manual JSON
- [ ] Dedupe prevents duplicate company+URL rows
- [ ] `raw_text` appears in Knowledge linked to opportunity
- [ ] Custom GPT Action can call the API (after OpenAPI upload)

## Next

- Epic 3B: scheduled scrapers → same ingest API
- Pursuit plan generation from opportunity + linked knowledge
