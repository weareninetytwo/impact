# Epic 5A: Quote Follow-Up

**Status:** Ready for testing (manual send — Impact drafts, you send)

First slice of the [Nurture Engine](./nurture-engine.md), pointed at ninety two's own sent quotes before anything is sold to clients.

## Problem

Quotes go out and most get no follow-up. Jobs are lost to silence, not to price.

## Solution

```
quote logged (form or API)
  → follow-ups scheduled for day 2, 5 and 10
  → /nurture shows what's due today
  → review / edit / optionally Redraft with Claude
  → Open in email (mailto) → send from your own inbox → Mark sent
  → Won / Lost closes the quote and cancels remaining follow-ups
```

- Only the earliest pending step per quote is shown, so steps never stack.
- If a step is sent late, later steps are pushed back to keep their spacing from the actual send date.
- Nothing is sent automatically. Email delivery and SMS (which needs carrier A2P 10DLC registration) come later, once the test shows follow-up moves win rate.

## The test this supports

The stats row compares **win rate on closed quotes that had at least one follow-up sent** vs **closed quotes with none**. Run it for two weeks on real quotes: the question is whether follow-up closes jobs that would otherwise go quiet.

## Database

Run in Supabase SQL Editor:

`packages/db/supabase/deploy-v0.3.0-quote-follow-up.sql`

Creates `quotes` and `quote_follow_ups`. Without Supabase, data is stored in `apps/agency/data/quote-follow-ups.json`.

## Environment

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Optional — enables **Redraft with Claude** (`claude-opus-5-5`, low effort, server-side refusal fallback on) |
| `IMPACT_QUOTE_SENDER_NAME` | Sign-off on template drafts (default `ninety two`) |
| `IMPACT_INGEST_SECRET` | Bearer for `POST /api/quotes/import` |

## API

### Log quotes from a quoting tool / Zapier / n8n

```bash
curl -X POST https://impact.weareninetytwo.xyz/api/quotes/import \
  -H "Authorization: Bearer YOUR_IMPACT_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "customer_name": "Maria Lopez",
      "company_name": "Lopez Dental",
      "contact_email": "maria@example.com",
      "job_type": "channel letter storefront sign",
      "amount": "$8,450",
      "quote_sent_at": "2026-10-14",
      "external_ref": "Q-1001"
    }]
  }'
```

Response: `{ "created": 1, "skipped": 0, "errors": [] }`. `external_ref` dedupes repeat deliveries (counted as `skipped`). Max 100 items per request; `amount` accepts numbers or formatted strings.

## UI

| Route | Purpose |
|-------|---------|
| `/nurture` | Due-today queue, log a quote, open/closed quotes, win-rate comparison |
