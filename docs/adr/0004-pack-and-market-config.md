# 0004 — Config storage for industry packs and markets

**Status:** Proposed

## Context
Scoring, offers, keywords, signal sources and templates were constants. Phase 0 moved scoring and offers into `ScoringConfig` (`packages/engines/src/scoring-config.ts`), with a default that reproduces ninety two exactly (pinned by a golden test). Packs (industry) and markets (city or territory) must vary independently, and tenants must be able to override.

## Options
1. Everything in code. Safest and reviewable, but each change is a deploy and tenants cannot self-serve.
2. Everything in DB tables. Flexible, but unversioned edits can silently change scoring and break comparisons.
3. **Hybrid:** packs shipped in code (versioned, tested), tenant overrides and market definitions in the DB.

## Decision
Option 3. A tenant selects `pack_id` and `pack_version`. Overrides live in a `tenant_config` table as a validated JSON patch applied over the pack. Resolution order: platform default, pack, market, tenant override. Scores store the pack id and version they were produced with, so history stays explainable.

## Consequences
- Validate overrides with a schema on write; reject unknown keys.
- Pin each tenant to a pack version; upgrades are explicit.
- Every new pack needs a golden test like the ninety two one.
- Do not add a pack until a real second customer in that industry exists.
