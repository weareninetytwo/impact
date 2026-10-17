# 0008 — Cost model and metering

**Status:** Proposed. **No pricing is decided or recommended here.**

## Context
The brief floated a pricing unit (per exclusive territory and industry rather than per seat). Pricing work is out of scope. What is needed now is knowing what each opening costs to produce, so any price is grounded.

## Options
1. Ignore cost until revenue exists. Risks an unprofitable tenant going unnoticed.
2. **Meter now, price later:** record every paid call (LLM tokens, enrichment credits, image calls, email sends) with tenant, kind and cost estimate.
3. Build billing and plans now. Premature.

## Decision
Option 2. A `usage_events` table (tenant_id, kind, quantity, est_cost_usd, ref, created_at), written by the LLM gateway (ADR 0009) and connectors. A weekly query yields cost per tenant and per signal. The pricing unit stays open until a pilot shows cost and willingness to pay.

## Consequences
- Estimates drift from real invoices; reconcile monthly.
- Metering must never block the main flow if the write fails.
