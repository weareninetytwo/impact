# Impact — Database Schema

**Start simple. No overengineering.**

---

## Principles

1. **Flat before nested.** Prefer foreign keys over JSON blobs for relational data.
2. **Tenant-scoped everything.** Every table includes `tenant_id`.
3. **Audit trail built in.** `created_at`, `updated_at` on every table. Activities log all changes.
4. **RLS from day one.** Supabase Row Level Security enforces tenant isolation.
5. **Extend, don't redesign.** New fields and tables are additive.
6. **Engines use jsonb for flexible profiles.** Qualification, nurture, and brief data stored as structured jsonb until query patterns demand normalization.

---

## Entity Relationship Overview

```
Tenants
  └── Users
  └── Integrations
  └── Workflows
  └── Offers (in settings jsonb)

Companies
  └── Contacts
  └── Signals
  └── Opportunities
        ├── Activities
        ├── Tasks
        ├── Proposals
        ├── Closer Briefs
        ├── Nurture Enrollments
        └── Qualification (jsonb on opportunity)
```

---

## Tables

### tenants

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Display name |
| slug | text | Unique, URL-safe |
| settings | jsonb | Scoring, ICP, offers, nurture templates, FAQ library, urgency config |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, matches auth.users.id |
| tenant_id | uuid | FK → tenants |
| email | text | |
| full_name | text | |
| role | text | `owner`, `admin`, `bd_rep`, `viewer` |
| avatar_url | text | Nullable |
| preferences | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### companies

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| name | text | |
| domain | text | Nullable |
| industry | text | Nullable |
| employee_count | integer | Nullable |
| revenue_range | text | Nullable |
| location | text | Nullable |
| description | text | Nullable |
| logo_url | text | Nullable |
| apollo_id | text | Nullable |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, domain)` unique where domain is not null.

---

### contacts

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| company_id | uuid | FK → companies |
| first_name | text | |
| last_name | text | |
| email | text | Nullable |
| phone | text | Nullable |
| title | text | Nullable |
| linkedin_url | text | Nullable |
| role_type | text | `decision_maker`, `influencer`, `champion` |
| apollo_id | text | Nullable |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### signals

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| company_id | uuid | FK → companies, nullable until matched |
| type | text | `rfp`, `funding`, `hiring`, `press_release`, `expansion`, `fleet`, `leadership_change`, `website_change`, `other` |
| title | text | |
| source | text | `apollo`, `news`, `rfp`, `scout`, etc. |
| source_url | text | Nullable |
| raw_data | jsonb | |
| detected_at | timestamptz | |
| status | text | `new`, `matched`, `scored`, `dismissed` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### opportunities

Central entity. Extended for qualification and nurture.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| company_id | uuid | FK → companies |
| signal_id | uuid | FK → signals, nullable |
| title | text | |
| stage | text | See pipeline stages below |
| **lead_grade** | text | **`A`, `B`, `C`, `D`** |
| **readiness** | text | **`ready_now`, `ready_later`, `not_a_fit`** |
| fit_score | numeric(5,2) | 0–100 |
| revenue_score | numeric(5,2) | 0–100 |
| urgency_score | numeric(5,2) | 0–100 |
| confidence_score | numeric(5,2) | 0–100 |
| composite_score | numeric(5,2) | Weighted aggregate |
| estimated_value | numeric(12,2) | Nullable |
| recommended_services | text[] | |
| **routed_offer** | text | Nullable, matched offer name |
| **qualification** | jsonb | See qualification schema below |
| **closer_brief_id** | uuid | FK → closer_briefs, nullable |
| assigned_to | uuid | FK → users, nullable |
| research_summary | text | Nullable |
| next_action | text | Nullable |
| next_action_due | timestamptz | Nullable |
| closed_at | timestamptz | Nullable |
| closed_reason | text | `won`, `lost`, `disqualified` |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Pipeline stages:** `new`, `researching`, `nurturing`, `qualified`, `outreach`, `engaged`, `call_booked`, `proposal`, `negotiation`, `won`, `lost`

**Indexes:** `(tenant_id, stage)`, `(tenant_id, lead_grade)`, `(tenant_id, composite_score DESC)`, `(tenant_id, assigned_to)`.

#### qualification jsonb schema

```json
{
  "project_need": "Rebrand after Series B",
  "budget_range": "$50K–$150K",
  "budget_confidence": 65,
  "timeline": "Q3 2026",
  "urgency_trigger": "RFP due in 14 days",
  "decision_maker_status": "CMO engaged, CEO not yet",
  "decision_maker_confirmed": false,
  "approval_process": "Board approval >$100K",
  "pain_points": ["Brand inconsistency across 12 locations"],
  "deadline": "2026-03-31",
  "service_fit": "Brand Rollout Package",
  "red_flags": [],
  "grade_rationale": "Strong fit, budget inferred from funding size",
  "last_graded_at": "2026-06-27T10:00:00Z",
  "graded_by": "qualifier_agent"
}
```

---

### closer_briefs

Generated before human calls. Required for A/B grade call booking.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| opportunity_id | uuid | FK → opportunities |
| company_summary | text | |
| signal_summary | text | |
| why_now | text | |
| project_type | text | |
| estimated_value | numeric(12,2) | Nullable |
| fit_score | numeric(5,2) | |
| urgency_score | numeric(5,2) | |
| confidence_score | numeric(5,2) | |
| lead_grade | text | |
| objections_raised | jsonb | Array of objection strings |
| previous_outreach | jsonb | Timeline of touches |
| suggested_offer | text | |
| discovery_questions | text[] | |
| proposal_angle | text | |
| generated_by | text | Agent or user ID |
| closer_rating | integer | Nullable, 1–5 post-call feedback |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, opportunity_id)`.

---

### nurture_enrollments

Tracks active nurture sequences per opportunity.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| opportunity_id | uuid | FK → opportunities |
| sequence_name | text | Template name from tenant settings |
| status | text | `active`, `paused`, `completed`, `exited` |
| current_step | integer | Step index in sequence |
| enrolled_at | timestamptz | |
| exited_at | timestamptz | Nullable |
| exit_reason | text | Nullable, e.g. `grade_upgraded`, `reply_received`, `unsubscribed` |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, opportunity_id)`, `(tenant_id, status)`.

---

### activities

Audit log and timeline.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| entity_type | text | `opportunity`, `company`, `contact`, `signal` |
| entity_id | uuid | |
| type | text | See activity types below |
| description | text | |
| actor_type | text | `user`, `agent`, `system`, `integration` |
| actor_id | text | |
| metadata | jsonb | |
| created_at | timestamptz | |

**Activity types:** `created`, `updated`, `stage_changed`, `grade_changed`, `score_updated`, `research_completed`, `outreach_sent`, `outreach_drafted`, `nurture_step_sent`, `faq_response_sent`, `urgency_message_sent`, `objection_logged`, `closer_brief_generated`, `call_booked`, `task_created`, `task_completed`, `proposal_sent`, `note_added`, `integration_sync`

---

### tasks

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| opportunity_id | uuid | FK → opportunities, nullable |
| company_id | uuid | FK → companies, nullable |
| title | text | |
| description | text | Nullable |
| type | text | `follow_up`, `research`, `outreach`, `proposal`, `meeting`, `qualification`, `other` |
| status | text | `pending`, `in_progress`, `completed`, `cancelled` |
| priority | text | `low`, `medium`, `high`, `urgent` |
| assigned_to | uuid | FK → users, nullable |
| due_at | timestamptz | Nullable |
| completed_at | timestamptz | Nullable |
| created_by | text | |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### proposals

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| opportunity_id | uuid | FK → opportunities |
| company_id | uuid | FK → companies |
| title | text | |
| status | text | `draft`, `review`, `sent`, `accepted`, `declined` |
| content | text | Nullable |
| template_id | text | Nullable |
| estimated_value | numeric(12,2) | Nullable |
| sent_at | timestamptz | Nullable |
| responded_at | timestamptz | Nullable |
| created_by | uuid | FK → users |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### workflows

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| name | text | |
| description | text | Nullable |
| trigger | text | e.g. `signal.created`, `opportunity.grade_changed` |
| conditions | jsonb | |
| actions | jsonb | Ordered agent invocations |
| is_active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### integrations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| provider | text | |
| status | text | `connected`, `disconnected`, `error` |
| credentials | jsonb | Encrypted |
| config | jsonb | |
| last_synced_at | timestamptz | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, provider)` unique.

---

## Tenant Settings Schema

Stored in `tenants.settings` jsonb:

```json
{
  "scoring": {
    "fit_weight": 0.35,
    "revenue_weight": 0.30,
    "urgency_weight": 0.20,
    "confidence_weight": 0.15,
    "auto_research_threshold": 70,
    "auto_outreach_threshold": 80
  },
  "qualification": {
    "grade_a_min_fit": 80,
    "grade_a_min_budget_confidence": 70,
    "grade_b_min_fit": 65,
    "grade_c_min_fit": 40,
    "require_closer_brief_for_call": true
  },
  "icp": {
    "industries": ["technology", "healthcare", "finance"],
    "employee_min": 50,
    "employee_max": 5000,
    "revenue_min": "$10M"
  },
  "offers": [
    {
      "name": "Brand Strategy Sprint",
      "trigger_signals": ["funding", "leadership_change"],
      "min_fit_score": 65,
      "min_budget": "$25K",
      "proposal_template_id": "brand-strategy-sprint"
    }
  ],
  "nurture_sequences": [],
  "faq_library": [],
  "urgency_triggers": {
    "strategy_slots_per_quarter": 3,
    "production_lead_weeks": 8
  },
  "services": [
    "Brand Strategy",
    "Visual Identity",
    "Website Design"
  ]
}
```

---

## Migration Strategy

| Phase | Tables | Notes |
|-------|--------|-------|
| **Phase 1 (Foundation)** | tenants, users, companies, contacts, signals, opportunities, activities, tasks | Core schema with qualification fields on opportunities |
| **Phase 2 (Engines)** | closer_briefs, nurture_enrollments, proposals, workflows, integrations | Qualification and nurture engine support |
| **Phase 3 (Scale)** | Analytics views, materialized aggregates, full-text search | Performance optimization |

All migrations via Supabase CLI. No manual schema changes in production.

---

## What We Are Not Building (Yet)

- Separate tables for email threads or call logs (Activities + metadata)
- Complex org-chart modeling (Contacts with `role_type` is sufficient)
- Individual FAQ response records (log in Activities with metadata)
- Agent run history table (log to Activities with `actor_type = 'agent'`)
- Multi-currency or invoicing

Keep the schema flat. Add tables when query patterns demand it.

---

## Related Documentation

- [qualification-engine.md](./qualification-engine.md) — Qualification fields and grading
- [nurture-engine.md](./nurture-engine.md) — Nurture enrollment and sequences
- [architecture.md](./architecture.md) — Engine and agent architecture
