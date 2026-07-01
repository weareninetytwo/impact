# Impact — Current State

**Last updated:** 2026-07-01  
**Platform version:** 0.3.0  
**App:** `@impact/agency` (Next.js 15, Supabase)

---

## One-line summary

Impact is a **working sales command center** (intake → review → pipeline → knowledge → outreach drafts → automation runs). It is **not yet** an autonomous revenue engine or full proposal/qualification platform.

---

## Platform modules (live readiness)

| Module | % | Status |
|--------|---|--------|
| Revenue Engine | 92% | Opportunities, stages, grades, compliance |
| Scout Engine | 75% | Manual scout + watch; noisy feeds |
| Knowledge | 100% | Live |
| Proposals | 70% | Export scripts + Morrisville package; in-app partial |
| Outreach | 80% | Draft queue; Gmail blocked |
| Intelligence | 30% | Epic 4 — not shipped |
| Automation | 65% | Pipeline runner + briefing |
| Auth | 100% | Supabase live |
| Project Intelligence | 40% | `docs/roadmap/` session docs (this initiative) |

See `docs/roadmap/NEXT_ACTIONS.md` for what to do next.

---

## Active business pursuit (ninety two)

### SUNY Morrisville RFP 25-12 — Marketing Services 2026

| Item | Status |
|------|--------|
| Technical proposal PDF | ✅ ~13 pages, no dollar amounts |
| Cost proposal PDF | ✅ $225K sealed envelope structure |
| MWBE plan | ✅ Factual 6/30 outreach; Linden meeting requested, **not confirmed** |
| Legal entity | ✅ `we are ninety two, inc. dba ninety two` |
| Print gate | ❌ EIN, signed forms, VendRep, reference auth |
| Deadline | **July 7, 2026 · 1:00 PM EST** — hard copy to Morrisville |

**Repo path:** `content/proposals/export/suny-morrisville/`  
**Impact opportunity ID:** `9c2786f4-56a0-480e-ab8c-e1eb925f8697`

---

## What works today

- Auth, login, tenant scoping
- Opportunities pipeline (score, grade, stages, compliance checklist)
- GPT/API import → review queue → approve → pipeline + knowledge
- Knowledge engine (link to opportunities)
- Dashboard stats (tenant-scoped; pending review vs last Watch run separated; nurturing + in proposal tiles)
- Scout + Opportunity Watch (manual; quality issues)
- Outreach draft queue (send blocked without Gmail OAuth)
- Automation pipeline (research → outreach → proposal drafts)
- Proposal export: `node scripts/regenerate-proposal-package.mjs [slug]`

---

## Known gaps

- Pitched-pipeline reporting (proposed amount, sent date) — next internal-launch fix
- Gmail integration (OAuth env vars)
- Apollo / real SAM.gov ingest (stubs)
- Intelligence Engine (Epic 4)
- Qualification, Nurture, Companies, Contacts, Analytics — mostly placeholders
- Scout signal quality (Google News proxy noise)

---

## Deployment

- Vercel project linked: `prj_zgIgGCrdlPu7FXUrOuukF00pHmGe`
- Persistence: Supabase (production)
- Regenerate proposals locally; print externally (Staples)

---

## Documentation map

| Doc | Purpose |
|-----|---------|
| [NEXT_ACTIONS.md](./NEXT_ACTIONS.md) | What to do next |
| [CHANGELOG.md](./CHANGELOG.md) | What changed when |
| [../handoffs/CURSOR_HANDOFF.md](../handoffs/CURSOR_HANDOFF.md) | Cursor session context |
| [../roadmap.md](../roadmap.md) | Legacy long-term roadmap |
