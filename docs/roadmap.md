# Impact — Roadmap

**From foundation to autonomous growth infrastructure**

---

## Guiding Principle

Every phase delivers a working increment on the full path:

```
signal → score → research → personalize → nurture → qualify → urgency → booked call → closer brief → close → follow up forever
```

No phase builds infrastructure that isn't used by the next phase.

**Product principle:** AI eliminates wasted sales time. Humans close qualified opportunities.

---

## Phase Overview

| Phase | Name | Outcome |
|-------|------|---------|
| 0 | Foundation | Deployable app shell with auth, dashboard, database |
| 1 | Signals | Buying signals flow in from multiple sources |
| 2 | Scoring | Every signal scored and graded automatically |
| 3 | Research | AI research attached to qualified opportunities |
| 4 | Qualification | Pre-vet, grade, and generate closer briefs |
| 5 | Nurture | Automated nurture by signal type and grade |
| 6 | Outreach | Initial outreach drafts + FAQ/objection handling |
| 7 | Urgency & Booking | Ethical urgency + qualified call booking gate |
| 8 | Proposals | Proposal generation and tracking |
| 9 | Automation | Full autonomous agent chains |
| 10 | Platform (SaaS) | Multi-tenant self-serve product |

---

## Phase 0 — Foundation

**Goal:** Deployable application with auth, dashboard shell, navigation, and core database.

### Deliverables

- [ ] Monorepo structure (`apps/agency`, `apps/platform`, `packages/`)
- [ ] Product documentation (all docs/)
- [ ] Supabase project with Phase 1 schema migrated
- [ ] Authentication (Supabase Auth, tenant-scoped)
- [ ] Dashboard shell with navigation for all modules
- [ ] Pipeline view with stage columns and lead grade column
- [ ] Basic opportunity list page
- [ ] Settings page (tenant config, user profile)
- [ ] Vercel deployment pipeline

### Linear Epic: Foundation

| Task | Description |
|------|-------------|
| Product docs | All documentation including engines and strategy |
| Database schema | Core tables with qualification fields, RLS |
| UI architecture | Shared layout, navigation, module routing |
| Authentication | Supabase Auth, tenant assignment, roles |
| Dashboard shell | Landing page with placeholder briefing |
| Opportunity list | Basic pipeline/opportunity list page |

**Exit criteria:** User can sign in, navigate all modules (empty states), view opportunity list, app deploys to Vercel.

---

## Phase 1 — Signals

**Goal:** Buying signals flow into Impact automatically.

### Deliverables

- [ ] Signals module UI (list, filter, detail)
- [ ] Signal-to-company matching
- [ ] Manual signal creation
- [ ] Scout agent (basic)
- [ ] Signal importers

### Linear Epic: Signals

| Task | Description |
|------|-------------|
| RFP importer | Ingest RFPs from configured sources |
| News importer | Press releases and news mentions |
| Apollo importer | Company signals from Apollo API |
| Hiring importer | Marketing/brand/creative hiring activity |
| Expansion importer | Expansion announcements |

**Exit criteria:** Signals appear within minutes of occurring. Each matched to a company or flagged for review.

---

## Phase 2 — Scoring Engine

**Goal:** Every signal scored and promoted to opportunity with initial grade.

### Deliverables

- [ ] Analyst agent
- [ ] Scoring algorithm (fit, revenue, urgency, confidence)
- [ ] Initial lead grade assignment (A/B/C/D)
- [ ] Tenant-configurable scoring weights and ICP
- [ ] Auto-promotion from signals to opportunities
- [ ] Pipeline populated with scored, graded opportunities

### Linear Epic: Scoring Engine

| Task | Description |
|------|-------------|
| Analyst agent | Score using ICP, service catalog, signal type |
| Lead grading | Initial A/B/C/D assignment from scores |
| Scoring config UI | Weights, thresholds, ICP in Settings |
| Auto-promotion | Signals above threshold → opportunities |
| Pipeline integration | Graded opportunities in pipeline view |

**Exit criteria:** New signal scored and graded within 5 minutes. Visible in Pipeline with grade badge.

---

## Phase 3 — Research Agent

**Goal:** Qualified opportunities have AI research before human touch.

### Deliverables

- [ ] Researcher agent
- [ ] Research module UI
- [ ] Company summary, decision makers, pain points
- [ ] Website, brand, SEO audits
- [ ] "What to fix first" recommendations
- [ ] Auto-trigger on `researching` stage

### Linear Epic: Research Agent

| Task | Description |
|------|-------------|
| Researcher agent | Deep research from public data + LLM |
| Research UI | Artifacts on company/opportunity pages |
| Audit generators | Website, brand, SEO templates |
| Auto-trigger | Research on qualified opportunities |

**Exit criteria:** Opportunity entering pipeline has research summary and at least one audit within 15 minutes.

---

## Phase 4 — Qualification Engine

**Goal:** Every opportunity pre-vetted with full qualification profile and closer briefs for A/B grades.

### Deliverables

- [ ] Qualifier agent
- [ ] Qualification profile (all fields: budget, timeline, need, etc.)
- [ ] Lead grade computation with configurable thresholds
- [ ] Offer routing to tenant-configured offers
- [ ] Closer brief generation
- [ ] Qualification UI on opportunity detail
- [ ] Grade history and re-grade on new data

### Linear Epic: Qualification Engine

| Task | Description |
|------|-------------|
| Qualifier agent | Collect/infer qualification fields, assign grade |
| Qualification UI | Profile display and manual editing on Pipeline |
| Offer routing | Route to ninety two offers based on signal + fit |
| Closer brief | Generate brief for A/B grades |
| Grade gates | Block call booking without brief |

**Exit criteria:** A-grade opportunity has complete closer brief. Closers rate brief accuracy > 4.0/5.0.

---

## Phase 5 — Nurture Engine

**Goal:** B/C grade opportunities automatically nurtured based on signal type and grade.

### Deliverables

- [ ] Nurturer agent
- [ ] Nurture sequence templates (configurable in Settings)
- [ ] Signal-type-specific nurture paths
- [ ] Grade-specific nurture strategy (B = qualification, C = education)
- [ ] Nurture enrollment tracking
- [ ] Engagement detection and re-grade triggers
- [ ] D-grade reactivation at 90/180 days

### Linear Epic: Nurture Engine

| Task | Description |
|------|-------------|
| Nurturer agent | Draft nurture content by signal/grade/step |
| Sequence templates | Configurable in Settings |
| Enrollment tracking | nurture_enrollments table + UI |
| Engagement detection | Reply/click → re-grade |
| Reactivation | D-grade and stale C-grade sequences |

**Exit criteria:** B/C opportunities enrolled in nurture within 24 hours of grading. First touch sent/drafted.

---

## Phase 6 — Outreach + FAQ/Objection Engine

**Goal:** Initial outreach ready for review. Objections answered before calls.

### Deliverables

- [ ] SDR agent (initial outreach drafts)
- [ ] Outreach module UI (draft queue, review, send)
- [ ] FAQ/Objection engine with tenant knowledge base
- [ ] Proactive FAQ insertion in nurture emails
- [ ] Reactive objection response drafting
- [ ] Objection logging on opportunity record
- [ ] Gmail integration

### Linear Epic: Outreach

| Task | Description |
|------|-------------|
| SDR agent | Email, LinkedIn, phone script drafts |
| Outreach UI | Review, edit, approve, send workflow |
| FAQ engine | Knowledge base + proactive/reactive responses |
| Gmail connector | Send approved emails |
| Objection logging | Track raised objections for closer brief |

**Exit criteria:** BD rep opens opportunity with draft email, FAQ content in nurture, and logged objections in closer brief.

---

## Phase 7 — Ethical Urgency + Call Booking

**Goal:** Real urgency messaging for qualified leads. Only A/B grades book calls.

### Deliverables

- [ ] Ethical Urgency engine
- [ ] Tenant-configurable urgency triggers
- [ ] Urgency messages in nurture (B+ with valid triggers)
- [ ] Call booking gate (A/B only, brief required)
- [ ] Google Calendar integration
- [ ] Coordinator agent (follow-up tasks)

### Linear Epic: Urgency & Booking

| Task | Description |
|------|-------------|
| Urgency engine | Risk-aware messages from real constraints |
| Urgency config | Tenant triggers in Settings |
| Call booking gate | Pipeline blocks without grade + brief |
| Calendar connector | Book qualified calls |
| Coordinator agent | Auto-create follow-up tasks |

**Exit criteria:** < 10% unqualified calls booked. All urgency messages auditable with trigger source.

---

## Phase 8 — Proposal Engine

**Goal:** Proposals generated from opportunity context and tracked through pipeline.

### Deliverables

- [ ] Proposal module UI
- [ ] Template system with variable substitution
- [ ] AI generation from research + qualification + closer brief
- [ ] Proposal angle from offer routing
- [ ] Notion template sync

### Linear Epic: Proposal Engine

| Task | Description |
|------|-------------|
| Proposal UI | Create, edit, track linked to opportunities |
| Template system | Configurable with offer routing |
| AI generation | Draft from closer brief + research |
| Notion connector | Template sync |

**Exit criteria:** Proposal generated from opportunity in under 10 minutes.

---

## Phase 9 — Automation

**Goal:** Full agent chains run autonomously. Humans intervene at decision points only.

### Deliverables

- [ ] Workflow engine (trigger → conditions → actions)
- [ ] Automation module UI
- [ ] Full orchestration: Scout → Analyst → Qualifier → Researcher → Nurturer → SDR → FAQ → Urgency → Coordinator → Executive
- [ ] Executive agent daily briefing
- [ ] Slack integration (briefings, A-grade alerts)
- [ ] Analytics module (funnel, grade distribution, nurture conversion)

**Exit criteria:** Impact runs overnight—signals ingested, scored, graded, researched, nurtured, and briefed by morning.

---

## Phase 10 — Platform (SaaS)

**Goal:** Multi-tenant product any agency can configure and use.

### Deliverables

- [ ] `apps/platform` multi-tenant application
- [ ] Onboarding wizard (ICP → offers → integrations → first signal)
- [ ] Billing integration
- [ ] Self-service everything in Settings
- [ ] Public marketing site

**Exit criteria:** New agency signs up, configures, and receives scored opportunities within 24 hours.

---

## Linear Epics Summary

| Epic | Phase | Key Deliverables |
|------|-------|------------------|
| **1. Foundation** | 0 | Docs, schema, UI shell, auth, dashboard, opportunity list |
| **2. Signals** | 1 | RFP, news, Apollo, hiring, expansion importers |
| **3. Scoring Engine** | 2 | Analyst agent, lead grades, auto-promotion |
| **4. Research Agent** | 3 | Researcher agent, audits, auto-trigger |
| **5. Qualification Engine** | 4 | Qualifier agent, closer briefs, offer routing |
| **6. Nurture Engine** | 5 | Nurturer agent, sequences, reactivation |
| **7. Outreach + FAQ** | 6 | SDR agent, FAQ engine, Gmail |
| **8. Urgency & Booking** | 7 | Urgency engine, call gate, calendar |
| **9. Proposal Engine** | 8 | Templates, AI generation, Notion |
| **10. Automation** | 9 | Full agent chains, analytics, Slack |
| **11. Platform SaaS** | 10 | Multi-tenant, onboarding, billing |

---

## Build Team Workflow

| Role | Tool | When |
|------|------|------|
| Product / Architecture | ChatGPT | Specs, decisions, Linear epics |
| Engineering | Cursor | Feature implementation |
| Code Review | Codex | Refactoring, tests, security, SQL, performance |

**Rule:** Document first. Build second. Review always.

---

## Success at Each Milestone

| Milestone | User Experience |
|-----------|-----------------|
| Foundation | "I can log in and see where everything will live." |
| Signals | "New buying signals appear every morning." |
| Scoring | "Best opportunities ranked with A/B/C/D grades." |
| Research | "Research is done before I open the opportunity." |
| Qualification | "I only get on calls with qualified leads—and the brief is ready." |
| Nurture | "C-grade leads are being educated automatically." |
| Outreach + FAQ | "Objections are handled before I pick up the phone." |
| Urgency + Booking | "Urgency is real, not manufactured. Only qualified calls booked." |
| Proposals | "Proposal in 10 minutes, not 2 hours." |
| Automation | "Impact worked overnight. Here's my briefing." |
| Platform | "Any agency can set this up in a day." |

---

## Non-Goals

- CRM replacement
- Lead scraping at scale
- Cold email blasting
- False urgency or manipulation
- Invoicing or project management
- Custom AI model training

---

## Next Step: Epic 1 Foundation (Build)

Scaffold monorepo and implement Foundation only:

- Next.js app
- Supabase client setup
- Auth placeholder
- Dashboard shell
- Navigation
- Database migration files from database.md
- Basic opportunity list page
- No agents yet
- No external integrations yet
- Prioritize clean structure

---

## Related Documentation

- [vision.md](./vision.md) — Mission and principles
- [product-strategy.md](./product-strategy.md) — SaaS positioning
- [qualification-engine.md](./qualification-engine.md) — Qualification spec
- [nurture-engine.md](./nurture-engine.md) — Nurture, FAQ, urgency spec
- [architecture.md](./architecture.md) — Technical architecture
- [modules.md](./modules.md) — Module specifications
