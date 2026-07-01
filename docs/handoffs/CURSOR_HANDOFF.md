# Cursor Handoff

**Last updated:** 2026-07-01  
**Update rule:** Edit this file at the end of every Cursor session that changes product, proposals, or platform state.

---

## Session start (required)

Before any implementation:

1. Read `docs/roadmap/CURRENT_STATE.md`
2. Read `docs/roadmap/NEXT_ACTIONS.md`
3. Summarize current state + revenue impact of what you're about to do

---

## Active context

### SUNY Morrisville RFP 25-12

- **Deadline:** July 7, 2026 · 1:00 PM EST (received, not postmarked)
- **Status:** Content ready; **do not print** until compliance gate complete
- **Path:** `content/proposals/export/suny-morrisville/`
- **Regenerate:** `node scripts/regenerate-proposal-package.mjs suny-morrisville`
- **Legal:** `we are ninety two, inc. dba ninety two` (all lowercase)
- **Pricing:** $225K total — $130K working media, $95K agency pool ($45K ninety two / $40K WBE target / $10K MBE-SDVOB)
- **MWBE:** Linden = meeting requested, NOT confirmed
- **Impact opp:** `9c2786f4-56a0-480e-ab8c-e1eb925f8697`

### Impact platform

- **Version:** 0.3.0
- **Source of truth:** `docs/roadmap/*` + `docs/handoffs/CURSOR_HANDOFF.md`
- **Blocked:** Gmail OAuth, Apollo stub, Morrisville print gate

---

## Conventions

- Proposal markdown → PDF via `scripts/lib/proposal-html.mjs`
- No dollar amounts in technical proposals
- MWBE outreach must be factual (no fabricated dates)
- ninety two bids as **prime**; subs proposed not confirmed until quote
- Minimize scope in code changes; match existing patterns

---

## Last session summary

- Dashboard truth repair: tenant-scoped stats, accurate metric labels, nurturing tile, pending review vs last Watch, refresh control, unit tests (`fix/dashboard-truth`)

---

## Prior sessions

- Pricing transparency language updated (agency comp in fee line, not "no markup")
- Executive audit: conditional GO on Morrisville bid pending EIN/forms/refs/Linden
- Project Intelligence docs + session roadmap files initiated

---

## Files to know

| Area | Path |
|------|------|
| Proposals export | `content/proposals/export/` |
| Proposal HTML/PDF | `scripts/lib/proposal-html.mjs`, `scripts/regenerate-proposal-package.mjs` |
| Impact intake | `scripts/load-suny-morrisville-intake.mjs` |
| MWBE outreach | `scripts/send-mwbe-outreach.mjs`, `mwbe-outreach-log.json` |
| Agency app | `apps/agency/` |
| DB / pipeline | `packages/db/` |
| Engines | `packages/engines/` |
| Platform status | `docs/roadmap/CURRENT_STATE.md` |
