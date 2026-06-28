# Impact — Architecture

**Modular growth infrastructure platform**

---

## Design Philosophy

Impact is built as a **modular operating system**, not a monolithic application. Every feature belongs to exactly one module. Cross-cutting AI capabilities are implemented as **engines** invoked by modules through Automation.

The guiding question for every architectural decision:

> Does this help someone go from signal → closed deal with less friction?

**Product principle:** AI eliminates wasted sales time. Humans close qualified opportunities.

---

## Full Path Architecture

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  SIGNAL  │───▶│  SCORE   │───▶│ RESEARCH │───▶│PERSONALIZE│
│  FOUND   │    │  LEAD    │    │ COMPANY  │    │  ANGLE   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
┌──────────┐    ┌──────────┐    ┌──────────┐         │
│ FOLLOW UP│◀───│  TRACK   │◀───│  CLOSER  │◀────────┤
│ FOREVER  │    │  DEAL    │    │  BRIEF   │         │
└──────────┘    └──────────┘    └──────────┘         │
                     ▲               ▲                 │
                     │               │                 ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │  BOOK    │◀───│ QUALIFY  │◀───│ NURTURE  │
              │ QUALIFIED│    │ BUDGET/  │    │ + FAQ +  │
              │  CALL    │    │ TIMELINE │    │ URGENCY  │
              └──────────┘    └──────────┘    └──────────┘
```

---

## Repository Structure

```
impact/
├── apps/
│   ├── agency/          # ninety two tenant application
│   └── platform/        # Multi-tenant SaaS platform
├── packages/
│   ├── shared/          # Shared types, constants, mock data (Epic 1)
│   ├── db/              # Supabase client, schema, migrations (Epic 1)
│   ├── engines/         # Qualification, Nurture, FAQ, Urgency (placeholder Epic 1)
│   ├── agents/          # AI agent implementations (Epic 2+)
│   ├── integrations/    # Third-party connectors (Epic 2+)
│   └── ui/              # Shared UI components (future)
└── docs/                # Product documentation
```

---

## Application Modules

See [modules.md](./modules.md) for full module specifications.

| Module | Purpose |
|--------|---------|
| **Core** | Shared services, event bus, auth context, tenant config |
| **Dashboard** | Executive briefing, pipeline health, agent activity |
| **Pipeline** | Opportunity lifecycle, grades, closer briefs, call booking |
| **Signals** | Signal ingestion, matching, importers |
| **Companies** | Company records and enrichment |
| **Contacts** | Decision-makers and contact intelligence |
| **Research** | AI research artifacts and audits |
| **Outreach** | Draft queue, nurture sequences, send |
| **Proposals** | Proposal generation and tracking |
| **Tasks** | Next actions and reminders |
| **Automation** | Workflow engine and agent orchestration |
| **Analytics** | Funnel metrics, grade distribution, forecasting |
| **Settings** | ICP, scoring, offers, nurture templates, FAQ library |
| **Admin** | Users, integrations, billing |

---

## Cross-Cutting Engines

Engines are AI logic layers invoked by Automation and modules. They live in `packages/engines/`.

| Engine | Package | Purpose |
|--------|---------|---------|
| **Qualification** | `engines/qualification/` | Pre-vet prospects, assign grades, generate closer briefs |
| **Nurture** | `engines/nurture/` | Sequence-based education and follow-up |
| **FAQ / Objection** | `engines/faq/` | Answer objections before sales calls |
| **Ethical Urgency** | `engines/urgency/` | Risk-aware messaging from real constraints |

See dedicated docs: [qualification-engine.md](./qualification-engine.md), [nurture-engine.md](./nurture-engine.md).

---

## AI Agents

Each agent has **one job**. Agents live in `packages/agents/` and are orchestrated by Automation.

| Agent | Job | Output Module |
|-------|-----|---------------|
| **Scout** | Find buying signals on the internet | Signals |
| **Analyst** | Score fit, revenue, urgency, confidence | Pipeline |
| **Researcher** | Deep company research and audits | Research |
| **Qualifier** | Assess qualification, assign grade, generate closer brief | Pipeline |
| **SDR** | Write initial outreach drafts | Outreach |
| **Nurturer** | Draft nurture content by signal/grade | Outreach |
| **FAQ** | Answer objections and FAQs | Outreach |
| **Urgency** | Generate ethical urgency messages | Outreach |
| **Coordinator** | Schedule tasks and follow-ups | Tasks |
| **Executive** | Daily briefing | Dashboard |

### Scout

Finds: RFPs, funding, hiring, press releases, expansion, fleet changes, leadership changes, website changes.

### Analyst

Produces: fit score, revenue score, urgency, confidence, recommended services.

### Researcher

Produces: company summary, decision makers, pain points, website/brand/SEO audits, "what to fix first."

### Qualifier

Produces: qualification profile, lead grade (A/B/C/D), readiness status, routed offer, closer brief.

### SDR

Produces: email drafts, LinkedIn messages, phone scripts, follow-up sequences.

### Nurturer

Produces: educational emails, case study references, qualification questions, reactivation messages.

### FAQ

Produces: objection responses, FAQ answers, logged objections for closer brief.

### Urgency

Produces: risk-aware urgency notes from real constraints (capacity, deadlines, audit findings).

### Coordinator

Produces: follow-up tasks, proposal deadlines, meeting reminders, stale alerts.

### Executive

Produces: daily briefing—top opportunities, tasks due, agent activity, grade changes.

---

## Agent Orchestration

Agents do not call each other directly. Automation orchestrates the full chain:

```
Signal ingested
  → Scout validates/enriches
  → Analyst scores
  → Qualifier assesses → assigns grade (A/B/C/D)
  │
  ├── [A grade] → Closer brief generated → Call booking enabled
  ├── [B grade] → Nurturer enrolls (qualification sequence)
  │              → Researcher runs
  │              → SDR drafts initial outreach
  │              → FAQ handles replies → Qualifier re-grades
  ├── [C grade] → Nurturer enrolls (long-term education)
  │              → Researcher runs (if fit ≥ threshold)
  │              → Periodic re-grade (30/60/90 days)
  └── [D grade] → Disqualify → Reactivation queue (90/180 days)
  │
  → Urgency engine adds ethical nudges (B+ with valid triggers)
  → Coordinator schedules follow-ups
  → Executive includes in next briefing
```

Thresholds, triggers, and chains are configurable per tenant in Settings.

---

## Closer Handoff Architecture

Before any call is bookable, the Qualification Engine generates a closer brief:

```
Opportunity (A or B grade)
  │
  ▼
Qualifier agent assembles:
  ├── Company summary        ← Researcher output
  ├── Signal summary         ← Signals module
  ├── Why now                ← Urgency engine + signal context
  ├── Project type           ← Offer routing
  ├── Estimated value        ← Analyst revenue score
  ├── Scores (fit/urgency/confidence)
  ├── Lead grade + rationale ← Qualifier
  ├── Objections raised      ← FAQ engine log
  ├── Previous outreach      ← Outreach history
  ├── Suggested offer        ← Offer routing
  ├── Discovery questions    ← Qualifier (gap analysis)
  └── Proposal angle         ← Qualifier + Researcher
  │
  ▼
Closer brief stored → Pipeline module displays → Call booking enabled
```

**Gate:** Pipeline module blocks stage transition to `call_booked` unless `closer_brief_id` is set and `lead_grade` is A or B.

---

## Offer Routing

Configurable per tenant. Stored in `tenants.settings.offers`.

```
Signal type + fit score + qualification data
  │
  ▼
Offer routing rules (tenant-configured)
  │
  ▼
opportunities.routed_offer = matched offer
  │
  ▼
Proposal template + nurture sequence + closer brief angle
```

ninety two default offers documented in [product-strategy.md](./product-strategy.md).

---

## Integrations

Build **connectors**, not **dependencies**. All integrations in `packages/integrations/`.

| Integration | Role |
|-------------|------|
| **Apollo** | Contact enrichment, company data, signal import |
| **HubSpot** | Push qualified opportunities and closer briefs |
| **Salesforce** | Push qualified opportunities |
| **Pipedrive** | Push qualified opportunities |
| **Gmail** | Send outreach and nurture emails |
| **Google Calendar** | Book qualified calls |
| **Slack** | Daily briefings, grade alerts, A-opportunity notifications |
| **Linear** | Delivery project tracking post-close |
| **Notion** | Proposal templates, FAQ knowledge base |
| **OpenAI** | Primary LLM for agents |
| **Claude** | Secondary LLM for research and long-context |
| **Supabase** | Database, auth, realtime |
| **Vercel** | Hosting and deployment |

### Integration Principles

1. Optional by default—disabling never breaks core workflows
2. Push qualified data to CRMs—Impact owns pre-qualification
3. Webhook-first where possible
4. Credentials isolated per tenant

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router) |
| Backend | Next.js API + Supabase Edge Functions |
| Database | Supabase (Postgres) with RLS |
| Auth | Supabase Auth |
| AI | OpenAI + Claude via abstraction layer in `packages/agents/` |
| Hosting | Vercel |
| Task queue | Supabase + background jobs (Phase 2+) |

---

## Security Model

- Row Level Security on all tables—tenant isolation at database level
- Role-based access: Owner, Admin, BD Rep, Viewer
- API keys encrypted per tenant
- All agent actions logged in Activities
- Urgency messages auditable with trigger source
- No PII in agent prompts without consent configuration

---

## Deployment

| Environment | Purpose |
|-------------|---------|
| `development` | Local + Supabase local |
| `preview` | Vercel preview per PR |
| `production` | Vercel production |

Monorepo: `apps/agency` and `apps/platform` are separate Vercel projects sharing `packages/`.

---

## Related Documentation

- [modules.md](./modules.md) — Module specifications and engine mappings
- [qualification-engine.md](./qualification-engine.md) — Qualification and closer handoff
- [nurture-engine.md](./nurture-engine.md) — Nurture, FAQ, ethical urgency
- [database.md](./database.md) — Schema
- [product-strategy.md](./product-strategy.md) — SaaS positioning
