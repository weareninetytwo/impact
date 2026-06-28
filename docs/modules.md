# Impact — Modules

**Every feature belongs to exactly one module. Every engine plugs into modules.**

---

## Module Map

Impact has **14 application modules** and **4 cross-cutting engines**. Modules own UI, routes, and user-facing workflows. Engines own AI logic and are invoked by modules via Automation.

```
┌─────────────────────────────────────────────────────────────┐
│                        MODULES (UI)                         │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│Dashboard │ Pipeline │ Signals  │Companies │ Contacts        │
├──────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Research │ Outreach │Proposals │  Tasks   │ Analytics       │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│ Settings │ Admin │ Automation                               │
├─────────────────────────────────────────────────────────────┤
│                    ENGINES (AI Logic)                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│Qualification │   Nurture    │ FAQ/Objection│Ethical Urgency│
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Core

**Purpose:** Shared services, event bus, authentication context, tenant configuration.

**Owns:**
- Authentication session and tenant context
- Event bus (internal pub/sub between modules)
- Shared types and constants
- Error handling and logging
- Feature flags

**Does not own:** Business logic, UI, or data specific to any other module.

**Package:** `packages/shared/` (Core module logic ships here in Epic 1; event bus in a later epic)

---

## Dashboard

**Purpose:** Executive view—what matters today.

**Owns:**
- Daily briefing (Executive agent output)
- Pipeline health summary (counts by stage and grade)
- Top A-grade opportunities requiring action
- Agent activity feed
- Tasks due today
- Nurture performance snapshot

**Primary user:** Agency owners, BD leads.

**Engines used:** Executive (briefing), Qualification (grade summary).

---

## Pipeline

**Purpose:** Opportunity lifecycle from signal to closed deal.

**Owns:**
- Kanban/list view by stage
- Opportunity detail page
- Lead grade display (A/B/C/D) and grade history
- Qualification profile view and manual editing
- Closer brief display
- Stage transitions and won/lost/disqualified
- Call booking gate (A/B grade only, brief required)
- Offer routing display

**Primary user:** BD reps, closers.

**Engines used:** Qualification (grading, closer handoff), Analyst (scores).

**Key rule:** No opportunity advances to "call booked" without a lead grade of A or B and a generated closer brief.

---

## Signals

**Purpose:** Ingestion, normalization, and display of buying signals.

**Owns:**
- Signal list with filters (type, status, date, company)
- Signal detail view with raw data
- Manual signal creation
- Signal-to-company matching
- Signal importers (RFP, news, Apollo, hiring, expansion)
- Scout agent trigger

**Primary user:** BD team, automation.

**Engines used:** Scout (discovery), Analyst (initial scoring on ingest).

---

## Companies

**Purpose:** Company records, enrichment, and relationship mapping.

**Owns:**
- Company list and search
- Company detail (profile, signals, opportunities, contacts)
- Enrichment status and data sources
- Industry, size, location metadata

**Primary user:** BD reps, researchers.

---

## Contacts

**Purpose:** Decision-makers, roles, and contact intelligence.

**Owns:**
- Contact list per company
- Role type tagging (decision_maker, influencer, champion)
- Contact detail with activity history
- Apollo sync status

**Primary user:** BD reps.

**Engines used:** Qualification (decision maker status inference).

---

## Research

**Purpose:** AI-generated company intelligence.

**Owns:**
- Research artifact display per company/opportunity
- Company summary
- Decision-maker identification
- Pain point analysis
- Website, brand, and SEO audit outputs
- Research trigger (manual and automatic)
- "What to fix first" recommendations (feeds Nurture Engine)

**Primary user:** BD reps, closers (via closer brief).

**Engines used:** Researcher agent.

---

## Outreach

**Purpose:** All outbound communication—initial, nurture, follow-up.

**Owns:**
- Draft queue (review, edit, approve, send)
- Email, LinkedIn, and phone script drafts
- Nurture enrollment status and sequence progress
- Sent message history
- Engagement tracking (opens, clicks, replies)
- Gmail send integration

**Primary user:** BD reps.

**Engines used:** SDR (initial outreach), Nurturer (nurture content), FAQ/Objection (response drafts), Ethical Urgency (urgency notes).

---

## Proposals

**Purpose:** Proposal generation, templates, and tracking.

**Owns:**
- Proposal list by status (draft, review, sent, accepted, declined)
- Proposal editor with template variables
- AI-assisted generation from research + qualification data
- Proposal angle from closer brief
- Notion template sync

**Primary user:** BD reps, closers.

**Engines used:** Proposal angle from Qualification Engine closer brief.

---

## Tasks

**Purpose:** Next actions for every opportunity.

**Owns:**
- Task list (personal and team views)
- Task creation (manual and agent-generated)
- Due dates, priorities, assignments
- Task types: follow_up, research, outreach, proposal, meeting, qualification, other
- Stale opportunity alerts

**Primary user:** Everyone.

**Engines used:** Coordinator agent (auto-task creation).

---

## Automation

**Purpose:** Workflow engine—triggers, conditions, agent orchestration.

**Owns:**
- Workflow builder (trigger → conditions → actions)
- Agent chain configuration
- Active workflow monitoring
- Execution log

**Primary user:** Admins, owners.

**Orchestrates all engines:**

```
Signal ingested
  → Scout validates/enriches
  → Analyst scores
  → Qualifier assesses → assigns grade
  → [A] Closer handoff → book call
  → [B/C] Nurturer enrolls in sequence
  → Researcher runs (if threshold met)
  → SDR drafts initial outreach (if A/B)
  → FAQ engine handles replies
  → Urgency engine adds ethical nudges
  → Qualifier re-grades on engagement
  → Coordinator schedules follow-ups
  → Executive includes in briefing
```

---

## Analytics

**Purpose:** Conversion metrics, agent performance, pipeline forecasting.

**Owns:**
- Signal → opportunity → qualified call → close funnel
- Lead grade distribution over time
- Nurture conversion rates (C → A/B)
- Unqualified call rate
- Agent performance (runs, success, latency)
- Closer brief quality scores
- Revenue forecasting by stage and grade

**Primary user:** Owners, admins.

---

## Settings

**Purpose:** Tenant and user configuration.

**Owns:**
- ICP configuration (industries, size, revenue)
- Scoring weights and thresholds
- Service catalog and offer routing rules
- Nurture sequence templates
- FAQ/objection knowledge base
- Ethical urgency triggers and capacity constraints
- Notification preferences
- User profile

**Primary user:** Admins, owners.

---

## Admin

**Purpose:** Tenant management, user roles, integration configuration.

**Owns:**
- User management (invite, role assignment)
- Integration connections (Apollo, HubSpot, Gmail, Slack, etc.)
- API key management
- Tenant billing (SaaS phase)
- Audit log

**Primary user:** Owners only.

---

## Engine → Module Matrix

| Engine | Primary Module | Also Used In |
|--------|----------------|--------------|
| **Qualification** | Pipeline | Automation, Dashboard |
| **Nurture** | Outreach | Automation |
| **FAQ / Objection** | Outreach | Pipeline (closer brief) |
| **Ethical Urgency** | Outreach | Nurture Engine |
| **Scout** | Signals | Automation |
| **Analyst** | Pipeline | Signals, Automation |
| **Researcher** | Research | Automation, Pipeline |
| **SDR** | Outreach | Automation |
| **Coordinator** | Tasks | Automation |
| **Executive** | Dashboard | Automation |
| **Qualifier** | Qualification Engine | Pipeline, Automation |
| **Nurturer** | Nurture Engine | Outreach, Automation |

---

## Navigation Structure

```
Impact
├── Dashboard          ← default landing
├── Pipeline
├── Signals
├── Companies
├── Contacts
├── Research
├── Outreach
├── Proposals
├── Tasks
├── Analytics
├── Settings
└── Admin              ← role-gated
    Automation         ← role-gated, sub-nav under Admin
```

---

## Module Communication Rules

1. Modules **never import from each other** directly.
2. Cross-module data flows through **Core events** and the **database layer**.
3. Engines are invoked by **Automation** or on-demand via module API routes.
4. All modules read/write tenant-scoped data with RLS enforcement.
5. UI components shared across modules live in `packages/ui/`.

---

## Related Documentation

- [architecture.md](./architecture.md) — Technical architecture and agent specs
- [qualification-engine.md](./qualification-engine.md) — Qualification engine detail
- [nurture-engine.md](./nurture-engine.md) — Nurture, FAQ, urgency detail
- [database.md](./database.md) — Data model per module
