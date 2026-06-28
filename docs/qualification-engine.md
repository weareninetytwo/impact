# Impact — Qualification Engine

**Pre-vet every prospect before a human consultation**

---

## Purpose

The Qualification Engine ensures that **only qualified opportunities reach human closers**. It collects or infers the data needed to grade every lead, route to the right offer, and generate a complete closer brief—before anyone picks up the phone.

**Principle:** AI eliminates wasted sales time. Humans close qualified opportunities.

---

## What It Collects or Infers

For every opportunity, the engine builds a qualification profile:

| Field | Source | Example |
|-------|--------|---------|
| **Project need** | Signal type + research | "Rebrand after Series B funding" |
| **Budget range** | Inferred from company size/funding or collected via nurture | "$50K–$150K" |
| **Timeline** | Signal urgency + explicit response | "Q3 launch deadline" |
| **Urgency trigger** | Signal context | "RFP due in 14 days" |
| **Decision maker status** | Contact role + engagement | "CMO engaged, CEO not yet" |
| **Approval process** | Inferred or collected | "Board approval required >$100K" |
| **Pain point** | Research + signal analysis | "Brand inconsistency across 12 locations" |
| **Deadline** | Signal or explicit | "March 31 budget year end" |
| **Service fit** | Offer routing engine | "Brand Rollout Package" |
| **Red flags** | Pattern detection | "Asked for free spec work", "No budget authority" |
| **Readiness** | Composite assessment | `ready_now`, `ready_later`, `not_a_fit` |

Data sources layer: signal metadata → research artifacts → nurture responses → explicit form/chat collection → human notes.

---

## Lead Grades

Every qualified opportunity receives a letter grade:

### A — Ready to Close

- Budget confirmed or strongly inferred
- Decision maker identified and engaged
- Clear deadline or urgency trigger
- Strong service fit
- No significant red flags

**Action:** Book call immediately. Generate closer brief. Notify assigned closer.

### B — Good Fit, Timing Unclear

- Strong service fit and ICP match
- Budget or timeline not yet confirmed
- Decision maker may not be engaged yet
- Worth pursuing with nurture + qualification questions

**Action:** Continue nurture. Send qualification-focused touches. Re-grade after response.

### C — Nurture

- Potential fit but missing key data
- Timeline is 6+ months out
- Contact is influencer, not decision maker
- Signal is weak or indirect

**Action:** Enroll in long-term nurture sequence. Periodic re-scoring. No call booking.

### D — Disqualify

- Low budget relative to service minimum
- Bad fit (wrong industry, size, geography)
- Tire kicker patterns (free work requests, no authority, repeated non-response)
- Red flags confirmed

**Action:** Mark disqualified. Optional reactivation nurture at 90/180 days. No human time invested.

---

## Grading Logic

Grades are computed from weighted signals—not a single score:

```
Grade = f(
  fit_score,
  budget_confidence,
  timeline_proximity,
  decision_maker_engagement,
  urgency_score,
  red_flag_count,
  nurture_response_quality
)
```

**Default thresholds (tenant-configurable):**

| Grade | Conditions |
|-------|------------|
| A | fit ≥ 80 AND budget_confidence ≥ 70 AND decision_maker = true AND readiness = ready_now |
| B | fit ≥ 65 AND (budget_confidence ≥ 40 OR timeline known) AND no D red flags |
| C | fit ≥ 40 OR signal exists but key fields missing |
| D | fit < 40 OR red_flags ≥ 2 OR explicit not_a_fit |

Grades are **recomputed** on every new data point: nurture reply, research update, signal change, human note.

---

## Qualification Flow

```
Opportunity created (from signal or manual)
  │
  ▼
Analyst scores (fit, revenue, urgency, confidence)
  │
  ▼
Researcher enriches (pain points, decision makers, audits)
  │
  ▼
Qualifier agent assesses
  ├── Collects/infers qualification fields
  ├── Assigns lead grade (A/B/C/D)
  ├── Routes to offer (see offer routing)
  └── Determines next action
  │
  ├── A grade → Closer Handoff → Book call
  ├── B grade → Qualification nurture → Re-grade on response
  ├── C grade → Long-term nurture → Periodic re-grade
  └── D grade → Disqualify → Reactivation queue
```

---

## Closer Handoff

Before any human call, Impact generates a **Closer Brief**—a structured document containing everything the closer needs:

| Section | Contents |
|---------|----------|
| **Company summary** | Who they are, size, industry, recent news |
| **Signal summary** | What triggered this opportunity, when, source |
| **Why now** | Urgency trigger and timing context |
| **Project type** | Recommended offer and services |
| **Estimated value** | Revenue score translated to dollar range |
| **Fit score** | 0–100 with breakdown |
| **Urgency score** | 0–100 with trigger explanation |
| **Confidence score** | 0–100 with data quality notes |
| **Lead grade** | A/B/C/D with grade rationale |
| **Objections raised** | Known or predicted objections from FAQ engine |
| **Previous outreach** | Timeline of emails, LinkedIn, nurture touches |
| **Suggested offer** | Routed offer with pricing guidance |
| **Recommended discovery questions** | Tailored to gaps in qualification data |
| **Proposal angle** | Recommended positioning and differentiators |

**Rule:** No call is bookable without a generated closer brief. If data is insufficient, the grade stays B or C and nurture continues.

---

## Offer Routing

Based on signal type, research, and qualification data, the engine routes opportunities to tenant-configured offers.

**ninety two default offers:**

1. Website Audit / Redesign Sprint
2. Brand Strategy Sprint
3. Brand Rollout Package
4. Employer Brand / Recruiting Campaign
5. Signage + Environmental Graphics
6. Fleet Graphics Program
7. Search Visibility Audit
8. White-label Partner Program
9. Custom Enterprise / RFP Pursuit

Routing rules are configurable per tenant in Settings → Offers. Each offer defines:

- Trigger signal types
- Minimum fit score
- Minimum budget range
- Service bundle description
- Proposal template reference

---

## Qualifier Agent

**Job:** Assess qualification completeness and assign lead grade.

**Inputs:** Opportunity record, research artifacts, nurture history, contact data, signal context.

**Outputs:**
- Updated qualification profile (all fields above)
- Lead grade (A/B/C/D)
- Readiness status
- Routed offer
- Closer brief (if A or B with sufficient data)
- Next action recommendation

**Implementation:** `packages/agents/qualifier/`

---

## Module Ownership

| Concern | Primary Module |
|---------|----------------|
| Qualification UI (grade display, field editing) | Pipeline |
| Qualification logic and grading | Qualification Engine (via Automation) |
| Closer brief display | Pipeline |
| Closer brief generation | Qualification Engine (Qualifier agent) |
| Offer routing configuration | Settings |
| Call booking gate | Pipeline + Tasks |

---

## Data Model

See [database.md](./database.md) for schema details:

- `opportunities.lead_grade` — A/B/C/D
- `opportunities.readiness` — ready_now / ready_later / not_a_fit
- `opportunities.qualification` — jsonb with all qualification fields
- `opportunities.routed_offer` — text, FK to tenant offer config
- `closer_briefs` — generated brief documents linked to opportunities

---

## Success Criteria

- **< 10%** of booked calls marked unqualified by closers post-call
- **> 4.0/5.0** closer rating on brief accuracy
- **< 5 minutes** closer prep time before calls
- **100%** of A-grade calls have complete closer briefs
- Grades recompute within **5 minutes** of new qualification data

---

## Related Documentation

- [nurture-engine.md](./nurture-engine.md) — Nurture for B/C grade leads
- [architecture.md](./architecture.md) — Agent orchestration
- [product-strategy.md](./product-strategy.md) — Offer routing strategy
