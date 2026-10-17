# 0001 — Base branch and merge order

**Status:** Proposed (needs Gino's confirmation of production)

## Context
Five lineages diverged (production-reconcile, `fix/dashboard-truth`, quote follow-up, automation, the brief). The commit last deployed to production (`ba6861d`) no longer exists in the repo, so history appears to have been rewritten. Nothing was pushed to `main`.

## Options
1. Rebase everything onto `main`. Rewrites more history, loses the deployed lineage.
2. Merge into one integration branch, keep every original untouched.
3. Pick one lineage and port the rest by hand.

## Decision
Option 2. `claude/impact-integration` merges `fix/dashboard-truth`, then quote follow-up plus the brief, then a redaction commit. Originals stay as they are. The Nurture page merged as two tabs (lead sequences, quote follow-up).

## Consequences
- Typecheck, lint, tests and build are green on the integration branch.
- **Unverified:** that production runs the reconcile lineage (inferred through `32e7215`). Gino must confirm from the Vercel dashboard before this becomes `main`.
- The repo is public and `fix/dashboard-truth` holds sensitive bid data. Make the repo private; the redaction commit only cleans the integration branch.
- Quote follow-up SQL (`deploy-v0.3.0-quote-follow-up.sql`) has not been run anywhere.
