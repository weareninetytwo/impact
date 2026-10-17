# 0007 — Email delivery

**Status:** Proposed

## Context
Today nothing sends automatically. A person reviews each draft and sends it from their own mailbox (mailto or copy). This is the human approval gate. CAN-SPAM applies to commercial email; SMS and call recording need separate legal review.

## Options
1. Keep manual send. No deliverability or compliance risk beyond the sender's own.
2. Gmail/Microsoft OAuth: create **drafts** in the user's mailbox, user clicks send. Good UX, still human-approved.
3. Send through a service (Resend, Postmark, SES) from tenant domains. Needs domain authentication (SPF/DKIM/DMARC) and warm-up.
4. Full auto-send. Highest risk to the customer's domain.

## Decision
Keep manual send now; add option 2 next. Do not build option 3 or 4 before a customer asks and legal reviews. Any outbound email must include sender identity, a physical address and an opt-out.

## Consequences
- OAuth scopes should be minimal (compose drafts only). Google may require app verification for sensitive scopes.
- Store suppression/opt-out per tenant from day one.
