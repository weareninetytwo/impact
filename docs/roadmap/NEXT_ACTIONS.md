# Impact — Next Actions

**Last updated:** 2026-07-01  
**Filter:** Every item must pass the revenue-first rule in `docs/product-strategy.md`

---

## P0 — Revenue (ninety two wins work)

### SUNY Morrisville RFP 25-12 (deadline July 7)

- [ ] Send `linden-scope-inquiry.txt` — lock WBE scope/quote (~$40K target)
- [ ] Authorize references (FTS, Birddogs, Grist)
- [ ] Fill EIN + NYS Vendor ID on cost proposal / Summary Info Form
- [ ] Sign SUNY Attachments 1–5 + Summary Information Form
- [ ] File VendRep at portal.osc.state.ny.us
- [ ] MWBE follow-up 7/1 (TGW, JazzCast, Swyftlight)
- [ ] Final PDF review → regenerate day-of print
- [ ] Staples print ×3 technical, ×3 MWBE, ×1 cost sealed; USB; ship by **July 7 1 PM**

### Buffalo Bills / Highmark (nurture)

- [ ] Draft stadium activation outreach (Matt/Neal partnerships + Brian game presentation)
- [ ] Send from Gmail or copy from `/outreach` when OAuth live

### Epic 4.1 — Opportunity Brief (**next build, not shipped**)

- [ ] Plan in `docs/epic4-intelligence-engine.md` — dedicated Epic 4.1 spec not yet in repo
- [ ] Shared types: `OpportunityBriefArtifact`, `RevenueSoonScore`
- [ ] Engine: `generateOpportunityBrief()` + Knowledge matcher + win/heuristic scores
- [ ] DB: persist brief as `pipeline_artifacts` (`opportunity_brief`)
- [ ] Hook approve flow → queue brief generation
- [ ] UI: `OpportunityBriefPanel` on `/opportunities/[id]`
- [ ] Server action: refresh brief
- [ ] Verify on Morrisville + Bills opps
- [ ] typecheck + lint + build

---

## P1 — Revenue support (after 4.1 ships)

- [x] Dashboard truth repair — tenant-scoped stats, accurate labels, refresh control
- [ ] Pitched-pipeline tracking (proposed amount + sent date on opportunity)
- [ ] Auto-Apollo on approve (if not folded into 4.1 refresh)
- [ ] Gmail OAuth — send from Outreach
- [ ] Today's Revenue Queue on dashboard (approve / brief / outreach / proposal due)
- [ ] Cron Opportunity Watch (daily, tuned RSS only)

---

## Backlog (do not build until revenue case re-opened)

- SaaS packaging / multi-tenant sales
- Analytics polish / extra dashboards
- Project Intelligence DB migration
- Companies / Contacts / Analytics modules (hide in nav first)
- SAM.gov connector (90-day)
- Full Qualification / Nurture automation modules
- Strategy model (Epic 4.4)

---

## Session start checklist (Cursor)

1. Read `docs/roadmap/CURRENT_STATE.md`
2. Read `docs/roadmap/NEXT_ACTIONS.md`
3. Read `docs/handoffs/CURSOR_HANDOFF.md`
4. State: revenue impact of this session before coding

## Session start checklist (ChatGPT)

Paste: **Read CURRENT_STATE.md and NEXT_ACTIONS.md in docs/roadmap/ before recommending.**
