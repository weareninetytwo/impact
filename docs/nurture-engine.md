# Impact — Nurture Engine

**Educate, qualify, and reactivate—never spam**

---

## Purpose

The Nurture Engine automatically moves prospects through education and qualification based on **signal type**, **lead grade**, and **engagement history**. It sends or drafts context-aware messages that build trust, answer questions, and surface readiness—without cold blasts or false pressure.

**Principle:** Nurture before pressure. Education before urgency.

---

## What It Sends or Drafts

| Content Type | When | Example |
|--------------|------|---------|
| **Educational emails** | C/B grade, early nurture | "3 signs your brand is misaligned after expansion" |
| **Follow-ups** | After initial outreach, no response | "Quick follow-up on the rebrand signal we noticed" |
| **Risk-aware notes** | Ethical urgency triggers | "Q4 install windows are booking—worth planning now" |
| **Case study references** | Matched to industry/signal | "How we helped [similar company] through a Series B rebrand" |
| **Reminder emails** | Approaching deadlines | "Your RFP deadline is 10 days out—happy to discuss scope" |
| **Seasonal/timing nudges** | Budget cycles, launch seasons | "Many clients plan Q1 rollouts in October—timing check-in" |
| **"What to fix first" recommendations** | After research/audit | "Your top 3 brand gaps based on our website audit" |
| **Reactivation messages** | D-grade at 90/180 days, stale C-grade | "Still planning the rebrand? Here's what's changed since we last connected" |

All content is **drafted by AI** and enters a human review queue unless tenant enables auto-send for specific sequence types.

---

## Nurture by Signal Type

Different signals trigger different nurture paths:

| Signal Type | Nurture Focus | Sequence Length |
|-------------|---------------|-----------------|
| **RFP** | Urgency + capability proof + deadline awareness | 3–5 touches over 14 days |
| **Funding** | Growth brand needs + case studies + timing | 5–7 touches over 30 days |
| **Hiring** | Employer brand + recruiting campaign value | 4–6 touches over 21 days |
| **Expansion** | Rollout packages + consistency risk | 5–7 touches over 30 days |
| **Website change** | Audit findings + redesign sprint offer | 3–5 touches over 14 days |
| **Leadership change** | Strategy sprint + stakeholder mapping | 4–6 touches over 21 days |
| **Press release** | Momentum leverage + brand alignment | 2–4 touches over 10 days |
| **Fleet change** | Fleet graphics program + visibility | 3–5 touches over 14 days |

Sequences are tenant-configurable templates stored in Settings.

---

## Nurture by Lead Grade

| Grade | Nurture Strategy | Goal |
|-------|------------------|------|
| **A** | Minimal—confirmation + closer brief delivery | Book the call |
| **B** | Qualification-focused touches (budget, timeline, decision maker) | Upgrade to A |
| **C** | Long-term educational nurture | Stay top-of-mind, re-grade on engagement |
| **D** | Reactivation only at 90/180 day intervals | Win back or confirm dead |

---

## FAQ / Objection Engine

A sub-engine within Nurture that proactively addresses common objections and FAQs **before a sales call**. Reduces closer prep time and increases call quality.

### Objections & FAQs Handled

| Category | Questions / Objections |
|----------|------------------------|
| **Cost** | "How much does this cost?" / "We don't have budget" |
| **Process** | "What does working with you look like?" / "How long does a project take?" |
| **Timeline** | "Can you meet our deadline?" / "What's the typical timeline?" |
| **Why agency** | "Why hire an agency vs. in-house?" / "Why not a freelancer?" |
| **Cost of waiting** | "What happens if we wait?" / "What's the risk of delaying?" |
| **Differentiation** | "What makes [tenant] different?" / "Why you vs. competitors?" |
| **Materials needed** | "What do you need from us to get started?" |
| **Service integration** | "How do strategy, design, web, signage, and production work together?" |

### How It Works

1. **Proactive insertion:** FAQ content woven into nurture emails based on predicted objections (from research + signal type).
2. **Reactive response:** If a prospect replies with an objection or question, the FAQ engine drafts a response using tenant knowledge base.
3. **Objection logging:** All raised objections logged on the opportunity record for closer brief inclusion.
4. **Knowledge base:** Tenant-configurable FAQ/objection library in Settings. ninety two defaults pre-populated.

**Implementation:** `packages/agents/faq/` (invoked by Nurture Engine)

---

## Ethical Urgency Engine

A sub-engine that creates **moral scarcity and risk-aware messaging**—never false pressure. Frames urgency as education, not manipulation.

### Valid Urgency Triggers

| Trigger | Message Frame | Example |
|---------|---------------|---------|
| **Limited strategy slots** | Capacity reality | "We take on 3 strategy sprints per quarter—Q4 has one slot remaining" |
| **Production schedule windows** | Planning necessity | "Production schedules fill 6–8 weeks out—worth locking timeline now" |
| **Seasonal install timelines** | Physical constraint | "Spring install season books by January for outdoor signage" |
| **Launch deadlines** | Business risk | "Missing your Q1 launch window means 6+ months of misaligned brand in market" |
| **Hiring campaign timing** | Competitive pressure | "Employer brand before hiring surge—candidates notice inconsistency" |
| **RFP deadlines** | Hard deadline | "RFP due in 12 days—scope conversation needed this week" |
| **Budget-year planning** | Fiscal reality | "Most clients allocate brand budget in Q4 for Q1 execution" |
| **Competitor modernization** | Market risk | "Competitors in your space refreshed brand identity in the last 18 months" |
| **Website security/accessibility** | Compliance risk | "Accessibility gaps create legal exposure—audit found 12 WCAG violations" |
| **Brand inconsistency during expansion** | Operational risk | "12 locations with inconsistent brand erodes trust during growth phase" |

### Rules

1. **Real constraints only.** Every urgency message must map to a verifiable fact (capacity, deadline, audit finding, market data).
2. **Education, not manipulation.** Frame as "here's what we've observed" not "act now or lose out."
3. **Tenant-configurable.** Each tenant defines their valid urgency triggers and capacity constraints in Settings.
4. **Logged and auditable.** Every urgency message logged in Activities with the trigger source.
5. **Never for D-grade leads.** Urgency messaging only for B-grade and above with genuine triggers.

**Implementation:** `packages/agents/urgency/` (invoked by Nurture Engine)

---

## Nurture Sequences

### Sequence Structure

```json
{
  "name": "Funding → Brand Strategy Sprint",
  "trigger": { "signal_type": "funding", "min_fit_score": 50 },
  "target_grade": ["B", "C"],
  "steps": [
    {
      "delay_days": 0,
      "type": "educational_email",
      "template": "funding_rebrand_signals",
      "include_faq": ["why_agency", "process"]
    },
    {
      "delay_days": 3,
      "type": "case_study",
      "template": "similar_industry_rebrand",
      "condition": "no_reply"
    },
    {
      "delay_days": 7,
      "type": "qualification_email",
      "template": "budget_timeline_question",
      "condition": "no_reply"
    },
    {
      "delay_days": 14,
      "type": "urgency_note",
      "template": "budget_year_planning",
      "condition": "no_reply",
      "requires_trigger": true
    },
    {
      "delay_days": 21,
      "type": "reactivation",
      "template": "soft_close_or_continue",
      "condition": "no_reply"
    }
  ],
  "exit_conditions": [
    "lead_grade_upgraded_to_A",
    "reply_received",
    "lead_grade_downgraded_to_D",
    "manual_unenroll"
  ]
}
```

---

## Nurturer Agent

**Job:** Select, personalize, and draft nurture content based on signal, grade, and sequence position.

**Inputs:** Opportunity record, lead grade, nurture enrollment, research artifacts, FAQ knowledge base, urgency triggers.

**Outputs:**
- Draft email/message content
- FAQ/objection responses (if reactive)
- Urgency notes (if triggers present)
- Updated nurture step position
- Re-grade recommendation (if engagement detected)

**Implementation:** `packages/agents/nurturer/`

---

## Engagement Detection

The Nurture Engine monitors for signals that should trigger re-grading:

| Engagement | Action |
|------------|--------|
| Email reply | Pause sequence. FAQ engine drafts response. Qualifier re-grades. |
| Link click | Log engagement. Consider accelerating sequence. |
| Calendar booking | Exit nurture. Trigger closer handoff. |
| Unsubscribe | Downgrade to D. Remove from active sequences. |
| No response after full sequence | Move to reactivation queue (90 days). |

---

## Module Ownership

| Concern | Primary Module |
|---------|----------------|
| Nurture sequence configuration | Settings |
| Nurture enrollment and status | Outreach |
| Draft review and send | Outreach |
| FAQ/objection knowledge base | Settings |
| Urgency trigger configuration | Settings |
| Engagement tracking | Activities |
| Re-grade triggers | Qualification Engine |

---

## Data Model

See [database.md](./database.md):

- `nurture_enrollments` — Active sequence tracking per opportunity
- `nurture_steps` — Step execution log
- `faq_responses` — Generated FAQ/objection responses
- `urgency_messages` — Ethical urgency messages sent/drafted
- `tenants.settings.nurture` — Sequence templates, FAQ library, urgency config

---

## Success Criteria

- **< 24 hours** from signal to first nurture touch
- **> 15%** C-grade → A/B conversion within 90 days
- **> 80%** of B-grade objections addressed before call (via FAQ engine)
- **Zero** false urgency messages (auditable via trigger source)
- **> 25%** email reply rate on nurture sequences (vs. < 5% on cold outreach)

---

## Related Documentation

- [qualification-engine.md](./qualification-engine.md) — Lead grades and closer handoff
- [architecture.md](./architecture.md) — Agent orchestration
- [product-strategy.md](./product-strategy.md) — Positioning and differentiation
