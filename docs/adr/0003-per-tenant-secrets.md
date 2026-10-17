# 0003 — Per-tenant secret storage and rotation

**Status:** Proposed

## Context
Today all secrets are environment variables: `IMPACT_INGEST_SECRET`, `IMPACT_SCOUT_SECRET`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, Supabase keys. Customers will bring their own Apollo and mailbox credentials (Apollo's terms bar reselling its data).

## Options
1. Env vars per deployment. Fine for separate pilot deployments; does not scale to tenants.
2. Encrypt in Postgres with `pgcrypto` or Supabase Vault, one key for the platform. Simple, but one key compromise exposes everyone.
3. Envelope encryption: a per-tenant data key, wrapped by a managed KMS key (AWS/GCP KMS). Rotation re-wraps keys, not data.
4. Customers paste nothing; use OAuth tokens only, stored as in 3.

## Decision
- Platform secrets stay in env (Vercel encrypted env).
- Customer credentials: option 3 in a `tenant_secrets` table (tenant_id, kind, ciphertext, key_version, created_at, rotated_at). Never returned to the browser; decrypted only inside the connector that needs it. Prefer OAuth over pasted keys.
- Replace global ingest/scout bearer secrets with **per-tenant, hashed, revocable API tokens** (store only a hash, show the token once).
- Rotation: tokens revocable at any time; data keys rotated on a schedule and on staff offboarding.

## Consequences
- Needs a KMS account and cost. Until then, Vault with a documented upgrade path is acceptable for a pilot, but not for general availability.
- Logs and error messages must never include secret values. Add a log-scrubbing test.
