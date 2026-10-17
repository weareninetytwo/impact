# Architecture decision records

One file per open decision in section 7 of [../impact-saas-brief.md](../impact-saas-brief.md).
Status is **Proposed** until Gino accepts it. Each ADR gives options, trade-offs and one recommendation.

| # | Decision | Recommendation |
|---|----------|----------------|
| [0001](0001-base-branch-and-merge-order.md) | Base branch and merge order | `claude/impact-integration` becomes the base after Gino confirms what production runs |
| [0002](0002-tenancy-enforcement.md) | Tenancy enforcement | App-layer filtering behind `getTenantId()` now; per-request scoped clients + RLS before the second customer |
| [0003](0003-per-tenant-secrets.md) | Per-tenant secrets | Customer credentials encrypted per tenant with a managed KMS key; platform secrets stay in env |
| [0004](0004-pack-and-market-config.md) | Pack and market config storage | Versioned packs in code; tenant overrides in a DB table |
| [0005](0005-connectors-and-job-runner.md) | Connectors and job runner | Connector interface + DB-backed job table, drained by cron-triggered short workers |
| [0006](0006-mockup-generation.md) | Mockup generation | Defer; start with a template-based mockup and no street imagery |
| [0007](0007-email-delivery.md) | Email delivery | Keep human-sends-from-own-mailbox; add Gmail/Microsoft OAuth drafts before any sending service |
| [0008](0008-cost-model-and-metering.md) | Cost model and metering (no pricing) | Meter every paid call per tenant now; defer the pricing unit |
| [0009](0009-observability-and-llm-cost-controls.md) | Observability and LLM cost controls | One LLM gateway function with per-tenant budgets and logging |
