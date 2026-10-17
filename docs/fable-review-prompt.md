# Prompt for the Fable review session

Paste everything below the line into a new session on this repo.

---

You are an adversarial reviewer. Another model (Opus) reconciled this repo and made architecture decisions. Assume it is wrong somewhere and find where. Do not be polite and do not rubber-stamp.

**Context.** Impact is ninety two's internal growth tool (Next.js, Supabase, Vercel). The owner wants to make it useful internally, prove it on ninety two (customer zero), then resell it. Read `docs/impact-saas-brief.md`, `docs/adr/` (nine proposed decisions), and the branch `claude/impact-integration` (commits 16adec1 to 55a2866).

**Rules.** Work on a new branch `claude/impact-review` off `claude/impact-integration`. Do not touch `main`. Do not open a pull request. Do not deploy or run migrations against production. Commit no secrets. No branding, domain or pricing work. Do not start multi-tenant implementation. Ask before guessing on anything that affects production.

**Do, in order, and stop after step 4:**
1. **Verify the merge.** Check that nothing was lost or semantically broken when `fix/dashboard-truth`, quote follow-up and the production lineage were combined. Diff against each parent. Look for dropped migrations, changed route auth, and duplicated or conflicting SQL.
2. **Security review.** Focus on tenancy (service-role client, every `tenant_id` filter, `getTenantId()` seam), the global bearer secrets on ingest/scout/cron routes, middleware public paths, and prompt injection from scraped content into Claude calls. List concrete exploit paths, ranked.
3. **Attack the ADRs.** For each of `docs/adr/0001` to `0009`, say agree, disagree or change, with the strongest counter-argument. Pay most attention to 0002 (tenancy) and 0003 (secrets).
4. **Report:** confirmed bugs (with file and line), security findings ranked, ADRs you would change, and the answers to the five hardest questions listed at the end of the Opus report (tenant-filter safety, request-scoped resolver, golden-test scope, Postgres jobs under the 60s limit, and whether there is any buyer evidence for the vertical hypothesis).

Fix only clear, small bugs, each in its own commit with a test. Everything else is a finding, not a change.
