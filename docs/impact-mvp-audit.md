# Impact MVP Audit — June 2026

**Verdict:** Strong **intake + pipeline + review** foundation. **Not production-ready** as an end-to-end pitch machine. Scout quality and several modules need work before calling it “ready to use.”

---

## What works today (use with confidence)

| Area | Status |
|------|--------|
| Auth, login, team tenant | ✅ Live |
| Opportunities pipeline (score, grade, stages) | ✅ Live |
| GPT/API import → review queue | ✅ Live |
| Approve / merge / skip → pipeline + knowledge | ✅ Live |
| Knowledge engine | ✅ Live |
| Dashboard stats | ✅ Live |
| Manual Scout + Opportunity Watch | ⚠️ Works but noisy |

---

## Critical issues found (your screenshots)

### 1. Raw HTML in review cards — **FIXED**
Google News RSS titles include `<a href>`, `<font>`, `&nbsp;`. Parser decoded entities but did not strip tags.

**Fix:** `stripHtml()` on RSS parse + review card display.

### 2. Wrong signal type (everything labeled `rfp`) — **FIXED**
NYSCR preset query contained the word `RFP`, and classification checked the **search query** not just the headline.

**Fix:** Classify from title/description only; default RSS items to `news`.

### 3. Misleading source names — **PARTIAL**
“NYSCR — NY public RFP search” is actually **Google News RSS proxy**, not NYSCR.gov.

**Fix:** Preset renamed; fit notes clarify proxy. Existing DB sources keep old names until re-created.

### 4. Low-quality Scout signal-to-lead ratio — **OPEN**
Google News returns general news (robotics competitions, OpenAI articles), not RFPs. Expected until:
- Real NYSCR / SAM.gov feeds (Epic 4)
- Tighter queries + post-fetch filtering
- Intelligence engine strategy types

### 5. Placeholder modules in nav — **OPEN**
Outreach, Nurture, Qualification, Proposals, Companies, Contacts, Tasks, Analytics = **empty placeholders**. Nav overpromises vs reality.

### 6. SAM.gov / Apollo stub failures — **BY DESIGN**
Stub sources fail if enabled. Disable them on `/signals/scout`.

---

## Module readiness matrix

| Module | Ready? | Notes |
|--------|--------|-------|
| Dashboard | ✅ | Real data |
| Opportunities | ✅ | Work A-grades here |
| Knowledge | ✅ | Add pitch assets |
| Signals / Review | ⚠️ | UX fixed; quality tuning needed |
| Scout / Watch | ⚠️ | Proxy feeds, not real RFP APIs |
| Settings | ⚠️ | Basic account/team |
| Qualification | ❌ | Placeholder |
| Outreach | ❌ | Placeholder |
| Nurture | ❌ | Placeholder |
| Proposals | ❌ | Placeholder |
| Companies / Contacts | ❌ | Placeholder |

---

## Recommended workflow until Epic 4

1. **Skip** the ~50 noisy Scout imports (or bulk-skip junk)
2. **Keep** manually curated opps + GPT imports with human review
3. **Work pipeline** — A-grades first, stage updates, pitch manually
4. **Disable** SAM/Apollo stubs; tune Google News queries
5. **Do not** expect automated outreach yet

---

## Fix priority backlog

| Priority | Item |
|----------|------|
| P0 | HTML strip + signal classification ✅ |
| P0 | Deploy scout fixes to production |
| P1 | Bulk skip / clear pending queue |
| P1 | Hide or badge placeholder nav modules |
| P1 | Scout relevance filter (keyword blocklist) |
| P2 | Real NYSCR / SAM.gov ingest (Epic 4) |
| P2 | Outreach + qualification modules |
| P3 | Enable daily cron after quality acceptable |

---

## Honest answer: “Can Impact handle the entire process?”

**Vision:** signal → score → research → outreach → nurture → qualify → close.

**Today:** signal → **review** → score → **pipeline** → **you pitch manually**.

Impact is a **command center for prioritizing and working leads**, not yet an autonomous revenue engine.
