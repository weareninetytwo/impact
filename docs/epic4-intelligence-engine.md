# Epic 4: Intelligence Engine

**Status:** Design only — do not build until Epic 3C manual tuning is complete

## Purpose

Impact already collects signals (GPT ingest, Scout, manual import) and queues them for human review. Epic 4 adds the **decision layer**: when you open an opportunity, Impact should answer the questions that turn a lead into action.

| Question | Intelligence output |
|----------|---------------------|
| Is this worth pursuing? | Pursuit recommendation + win probability |
| Why? | Evidence-backed rationale |
| What should we do next? | Next best action |
| What should we sell them? | Recommended service mix |
| What proof do we have? | Matching Knowledge / case studies |
| Who should we contact? | Decision maker research |
| What is the risk? | Risk flags + confidence gaps |

This is **not** proposal generation. It is **Intelligence** — the briefing that makes every downstream action (outreach, scope, proposal) faster and sharper.

## Position in the stack

```
Signals (3A ingest, 3B review, 3C Scout)
  → Opportunity (v0.2 command center)
  → Intelligence Engine (Epic 4)     ← this epic
  → Outreach / proposals (later epics)
```

Knowledge Engine (v0.2.5) is a core dependency: Intelligence retrieves proof, case studies, and capabilities from tenant Knowledge — not from generic LLM memory.

---

## Strategy model

Epic 3C organizes around **sources** (RSS, NYSCR stub, Google News). That was correct for MVP. Epic 4+ evolves Scout toward **strategies** — outcome-oriented monitors that fuse many sources into one high-confidence opportunity.

### Concept

A **strategy** is a tenant-configured pursuit pattern. Sources are infrastructure attached to strategies.

```
Strategy: Fleet
  ├── Google News (fleet + municipal keywords)
  ├── DOT registration feeds (future)
  ├── LinkedIn hiring (future)
  ├── Company press releases (RSS/HTML)
  ├── Fleet trade publications (RSS)
  └── Local business journals (RSS)
        ↓
   Fusion + dedupe + confidence weighting
        ↓
   One opportunity: "City of X — fleet rebrand RFP signal"
```

### Planned strategy presets (tenant-scoped)

| Strategy | Primary intent | Example signal types |
|----------|----------------|----------------------|
| **RFP** | Public / institutional bids | `rfp`, procurement portals |
| **Expansion** | Growth, new locations, hiring surges | `expansion`, `hiring`, `funding` |
| **Fleet** | Municipal / fleet / vehicle branding | `signage`, fleet wraps, wayfinding |
| **Healthcare** | Health systems, clinics, patient experience | `website_redesign`, `rfp`, `signage` |
| **Higher Education** | Colleges, SUNY, campus projects | `rfp`, `website_redesign`, `signage` |
| **Economic Development** | IDA, regional growth, incentives | `expansion`, `news`, `agency_partner` |
| **Partner** | Agency referrals, subcontractor leads | `agency_partner`, `other` |

### Data model (design)

| Entity | Role |
|--------|------|
| `scout_strategies` | Tenant-owned strategy definition (name, intent, enabled, fusion rules) |
| `scout_strategy_sources` | Many-to-many: strategy ↔ source (with weight override) |
| `scout_sources` | Existing Epic 3C table — becomes child of strategy |
| `signal_imports` | Gains optional `strategy_id`, `evidence_type`, `confidence_score` |
| `opportunity_intelligence` | Cached Intelligence snapshot per opportunity (see below) |

**Fusion rules (MVP design):** Same company + overlapping strategy within 7 days → merge signals, boost confidence, single review card. Cross-strategy overlap → surface as related signals, do not auto-merge.

**SaaS rule:** Every strategy, source, and intelligence record is `tenant_id` scoped. Presets are templates copied on tenant onboarding — not global hardcoded rows.

---

## Evidence confidence scoring

**Confidence is not AI confidence.** It is **evidence confidence** — how trustworthy the underlying source material is.

The `Opportunity` model already exposes `confidence_score` in scoring breakdown. Epic 4 defines how it is **computed, stored, and explained**.

### Evidence types

| Evidence type | Default confidence | Notes |
|---------------|-------------------|--------|
| `official_rfp_pdf` | 98 | Downloaded solicitation document |
| `gov_procurement_portal` | 95 | SAM.gov, NYSCR, BidNet, etc. |
| `company_press_release` | 92 | First-party announcement |
| `company_website_page` | 88 | Careers, newsroom, project pages |
| `linkedin_job_post` | 85 | Hiring surge signal |
| `trade_publication` | 80 | Industry press |
| `news_article` | 75 | Reputable news outlet |
| `google_news_rss` | 70 | Scout / aggregator (Epic 3C default) |
| `gpt_research` | 65 | Custom GPT ingest — useful, verify |
| `apollo_export` | 60 | List export, needs validation |
| `social_post` | 50 | LinkedIn/X post, unverified |
| `random_blog` | 30 | Low-trust web mention |

### Scoring rules

1. **Base score** from evidence type table above.
2. **Boost** (+3–8) when multiple independent evidence types corroborate the same claim (e.g. press release + news + hiring).
3. **Penalty** (−10–20) when source is stale (>90 days for expansion signals), URL dead, or company name ambiguous.
4. **Cap at 100.** Floor at 0.
5. **Show provenance:** UI displays "Confidence: 91% — gov portal + press release" not a black-box number.

### Where confidence lives

| Stage | Field |
|-------|--------|
| `signal_imports` | `evidence_type`, `confidence_score`, `confidence_rationale` |
| Review queue card | Badge + expandable evidence list |
| `opportunity_records` | `confidence_score` (already exists) — recomputed on approve from best evidence |
| Intelligence snapshot | `evidence_items[]` with type, url, score, excerpt |

---

## Intelligence panel (opportunity detail)

New section on `/opportunities/[id]` — **Intelligence** — above or beside existing Scoring breakdown and Knowledge section.

### Layout (mobile-first)

```
┌─────────────────────────────────────┐
│ Pursuit: STRONG  Win prob: 72%      │
│ Confidence: 91%  (gov portal + PR) │
├─────────────────────────────────────┤
│ Why pursue                          │
│ • Website ~6 years old (audit)      │
│ • Hiring Marketing Director         │
│ • Second location announced         │
│ • Similar to Gilbert's (case study) │
├─────────────────────────────────────┤
│ Recommended service mix             │
│ Website + Brand Refresh + Wayfinding│
│ Est. opportunity: $140k             │
├─────────────────────────────────────┤
│ Decision makers (placeholder)       │
│ • CMO — [LinkedIn stub]             │
│ • Facilities Dir — [research stub]  │
├─────────────────────────────────────┤
│ Risks                               │
│ • Incumbent agency unknown          │
│ • Deadline in 12 days               │
├─────────────────────────────────────┤
│ Next best action                    │
│ Draft intro email → [stub CTA]      │
└─────────────────────────────────────┘
```

### Panel sections

| Section | Epic 4 scope |
|---------|----------------|
| **Pursuit summary** | Strong / Moderate / Weak + win probability |
| **Confidence breakdown** | Evidence list with scores |
| **Why pursue** | Bullet rationale from signals + audits |
| **Company profile** | Name, industry, size, HQ, website — structured stub |
| **Website / brand / SEO audit** | Placeholder scores + findings (manual refresh later) |
| **Decision maker research** | Placeholder contacts with source links |
| **Matching Knowledge** | Retrieval from Knowledge Engine (case studies, proposals, capabilities) |
| **Win probability** | Heuristic model (see below) |
| **Recommended service mix** | Rule + Knowledge-informed bundle |
| **Recommended outreach angle** | One-paragraph hook, not full proposal |
| **Next best action** | Extends existing `next_action` with Intelligence context |
| **Risks** | Deadline, confidence gaps, competitor, budget unknown |

Existing panels (Scoring breakdown, Signal & source, Knowledge links) remain. Intelligence **augments** them; it does not replace the command center.

---

## Company profile

Structured record attached to an opportunity (or shared `company_profiles` table if same org appears in multiple opps).

**MVP fields (placeholders OK):**

- Legal / display name
- Website URL
- Industry / vertical
- Employee range (stub)
- HQ location
- Parent org / system (healthcare networks)
- Recent funding (stub)
- Expansion history (bullet list from signals)
- Hiring activity (stub)
- Known vendors / incumbent agency (where discoverable)

**Population sources (phased):**

1. Signal ingest payload (company_name, source_url, raw_text)
2. Manual edit on opportunity
3. Future: enrichment API (Clearbit, Apollo, etc.) — tenant-configured

---

## Website / brand / SEO audit placeholders

Not a full Lighthouse integration in Epic 4. **Structured placeholders** that can be filled manually or by a later audit worker.

| Audit area | Placeholder output |
|------------|-------------------|
| **Website** | Last major redesign estimate, CMS guess, mobile score stub, accessibility flag |
| **Brand** | Logo age estimate, visual consistency note, stale campaign detection |
| **SEO** | Domain authority stub, top keyword gaps, local pack presence |

Each finding: `{ area, finding, severity, source, observed_at }`.

UI shows 3 summary chips: `Website: dated` · `Brand: inconsistent` · `SEO: weak local`.

---

## Decision maker research

Placeholder section — not full CRM sync in Epic 4.

| Field | Source (future) |
|-------|-----------------|
| Name, title | LinkedIn / Apollo / manual |
| Email / phone | Tenant-provided only (no scraping PII without consent) |
| Relevance | "Budget owner", "Champion", "Gatekeeper" |
| Suggested intro path | Warm intro via Knowledge contact, cold email, RFP response |

**SaaS:** Contacts belong to tenant. No cross-tenant contact pool.

---

## Matching Knowledge / case studies

Reuse Knowledge Engine retrieval (`askKnowledge`, chunk search) with opportunity context:

**Query template:**

```
Company: {company_name}
Industry: {vertical}
Signal: {signal_type} — {signal_summary}
Services needed: {inferred from strategy}
```

**Return:**

- Top 3 case studies (type `case_study`)
- Relevant proposal excerpts (type `proposal`)
- Capabilities doc snippets (type `capabilities`)
- Similar client names ("Similar to Gilbert's")

Display as cards with link to `/knowledge/[id]`. Auto-link on Intelligence refresh (optional `opportunity_knowledge_links`).

---

## Win probability

Heuristic model for Epic 4 — not ML.

```
win_probability =
  w1 * normalized_fit +
  w2 * normalized_confidence +
  w3 * knowledge_match_score +
  w4 * urgency_factor +
  w5 * relationship_factor (stub: 0.5 default)
  − risk_penalties
```

| Band | Range | Label |
|------|-------|-------|
| High | 70–100 | Strong pursuit |
| Medium | 45–69 | Worth qualifying |
| Low | 0–44 | Deprioritize or nurture |

Show numeric % + band label. Store `win_probability` on intelligence snapshot; surface on opportunity header.

---

## Recommended service mix

Rule-based mapping from strategy + signal_type + audit findings + Knowledge:

**Example rules:**

- `website_redesign` + dated website audit → Website Redesign
- `expansion` + new location → Brand Refresh + Wayfinding + Signage
- `rfp` + healthcare + case study match → Full-service pitch bundle

Output: ordered list of service lines with optional estimated value range (from rate sheets in Knowledge when available).

---

## Recommended outreach angle

One paragraph — **angle**, not draft proposal:

> "Noticed your second Rochester location opening Q3 — we helped [Similar Client] unify brand and wayfinding across a multi-site rollout. Given your marketing hire, happy to share how we scoped phase 1."

Generated from: signal summary + matching case study + recommended service mix. Stored as `outreach_angle` on intelligence snapshot. Full email draft = later epic.

---

## Next best action

Extends existing `next_action` / `recommended_action` with Intelligence-aware priorities:

| Condition | Next action |
|-----------|-------------|
| RFP + deadline < 14d | Download RFP + schedule scope call |
| Expansion + no contact | Research decision maker + draft intro |
| Low confidence | Verify source before outreach |
| High win prob + warm Knowledge link | Request intro from internal champion |

Single primary CTA on Intelligence panel. Syncs to opportunity record.

---

## Multi-tenant design

Every Epic 4 entity follows existing Impact patterns:

| Concern | Pattern |
|---------|---------|
| Row scope | `tenant_id UUID NOT NULL REFERENCES tenants(id)` |
| RLS | Tenant policy via `auth.jwt() -> app_metadata -> tenant_id` |
| Server writes | Service role via `@impact/db` until Supabase Auth |
| Strategy presets | Copied per tenant on setup — not shared live data |
| Knowledge retrieval | Always filtered by `tenant_id` |
| Intelligence refresh | Async job per opportunity, tenant-scoped queue |
| Enrichment APIs | Tenant-owned API keys in settings (future) |

**Onboarding question:** "If another agency signed up tomorrow, would this feature still make sense?" Every Epic 4 table and UI section must pass that test.

---

## Architecture (high level)

```
Opportunity created / approved
  → enqueue intelligence_refresh(opportunity_id)
  → Intelligence worker:
       1. Load opportunity + linked signals + strategy
       2. Compute evidence confidence
       3. Run Knowledge retrieval
       4. Fill audit placeholders (manual/stub)
       5. Compute win probability + service mix + outreach angle
       6. Upsert opportunity_intelligence
  → UI reads snapshot (fast, cacheable)
```

**Tables (design):**

- `opportunity_intelligence` — snapshot JSON + scalar fields for list views
- `intelligence_evidence` — normalized evidence rows (optional normalization)
- `company_profiles` — reusable company context (optional Epic 4.1)

---

## Non-goals (Epic 4)

- Proposal PDF generation
- Full CRM / email send integration
- Headless browser scraping at scale
- Automated outreach without human review
- Cross-tenant benchmarks or shared lead pool
- Replacing review queue — Intelligence runs **after** approve (or on demand for queued preview in 4.1)
- Real-time LinkedIn scraping
- Guaranteed accurate decision maker emails

---

## Dependencies

| Dependency | Status |
|------------|--------|
| v0.2 Opportunities + scoring | Live |
| v0.2.5 Knowledge Engine | Live |
| v3B Review queue | Live |
| v3C Scout (manual) | Live — tune before cron |
| `confidence_score` on Opportunity | Field exists — needs evidence pipeline |
| Strategy model | Design in this doc — build Epic 4.1 or fold into 4 |

---

## Phased delivery (suggested)

| Phase | Deliverable |
|-------|-------------|
| **4.0** | Evidence confidence on `signal_imports` + review card |
| **4.1** | Intelligence snapshot table + panel shell with placeholders |
| **4.2** | Knowledge matching + win probability heuristic |
| **4.3** | Service mix + outreach angle + next best action |
| **4.4** | Strategy model (migrate Scout sources under strategies) |
| **4.5** | Audit worker stubs (website/SEO manual refresh) |

---

## Exit criteria

- [ ] Opening an approved opportunity shows Intelligence panel
- [ ] Confidence score is explained with evidence types (not opaque)
- [ ] At least 3 Knowledge matches (case studies / capabilities) when available
- [ ] Win probability + pursuit band displayed
- [ ] Recommended service mix shown for top 3 strategy types (RFP, Expansion, Fleet)
- [ ] Outreach angle generated (stub LLM or template — tenant-scoped)
- [ ] Next best action updates from Intelligence refresh
- [ ] Company profile section populated from signal + manual edit
- [ ] Website/brand/SEO sections render placeholder audit structure
- [ ] Decision maker section renders placeholder rows (no fake emails)
- [ ] All data tenant-scoped; second tenant sees empty/isolated Intelligence
- [ ] Review queue shows evidence confidence before approve
- [ ] No proposal generation shipped in this epic

---

## Relationship to Scout tuning (now)

Before Epic 4 code:

1. Run `deploy-v0.2.7-scout.sql`
2. Manual Scout for 2–3 days — tune dedupe, false positives, review UX
3. **Do not enable cron**
4. Note which strategies (not just sources) would have caught the best leads

That tuning feedback should inform strategy presets and confidence weights in Epic 4.

---

## North star

Opening a queued or approved opportunity should feel like opening a **briefing**, not a database row:

> **Fit: 94** · **Confidence: 91%**  
> Website is 6 years old. Hiring Marketing Director. Opening second location.  
> Similar to Gilbert's.  
> **Recommend:** Website + Brand Refresh + Wayfinding · **~$140k**  
> Draft first email ready.

That is the moment Impact becomes a **revenue operating system** — for ninety two and for any agency on the platform.
