# Epic 2: Opportunity Intake + Scoring

**Status:** Implemented

## What it does

- Manual opportunity creation (`/opportunities/new`)
- CSV import (`/opportunities/import`)
- Paste import (key:value blocks or CSV)
- Deterministic scoring engine (`packages/engines/src/scoring.ts`)
- Dedupe by company name + website/source URL
- Required `next_action` on every opportunity (auto-generated)
- Dashboard widgets from real stored data
- Stage workflow via detail page dropdown

## Data storage

Epic 2 uses **local JSON file storage** at `apps/agency/data/opportunities.json` when Supabase is not configured. This makes Impact usable immediately for ninety two without external setup.

Set `IMPACT_DATA_DIR` to override storage location.

## Scoring

| Score | Weight | Based on |
|-------|--------|----------|
| fit_score | 35% | Signal type, keywords, ICP fit |
| urgency_score | 25% | Deadline proximity |
| value_score | 25% | Estimated deal value |
| confidence_score | 15% | Data completeness |

**Grades:** A (ready) · B (good fit) · C (nurture) · D (skip)

## Stages (Epic 2)

`new` → `reviewed` → `contact_needed` → `ready_for_outreach` → `nurturing` → `call_booked` → `proposal` → `won` / `lost` / `skip`

## Linear

- [NIN-5 Epic 2: Opportunity Intake + Scoring](https://linear.app/weareninetytwo/issue/NIN-5/epic-2-opportunity-intake-scoring)
- [NIN-6 Epic 3: Signal Engine](https://linear.app/weareninetytwo/issue/NIN-6/epic-3-signal-engine)

Remaining epics (4–11) to be created in Linear when approved.

## Remains (Epic 3+)

- Supabase-backed repository (dual-write or replace file store)
- Signal importers feeding opportunities automatically
- Qualification engine + closer briefs
- Nurture sequences
- External integrations
