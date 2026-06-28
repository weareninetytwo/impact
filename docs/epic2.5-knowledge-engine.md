# Epic 2.5: Knowledge Engine

**Status:** In progress

## Purpose

Create Impact’s **Knowledge** module so future agents, proposal drafts, qualification, outreach, and closer briefs are grounded in real ninety two business knowledge — not generic AI output.

Knowledge is a first-class module, not a docs folder.

## Why Knowledge before Signal Engine (Epic 3)

| Without Knowledge | With Knowledge |
|-------------------|----------------|
| Epic 3 imports rows | Epic 3 imports **context** |
| Generic AI responses | Grounded in proposals, rates, SOPs |
| RFP = title + URL | RFP = indexed document + chunks |
| Proposal agent hallucinates | Proposal agent reads case studies |

**Rule:** Epic 3 feeds Knowledge + Opportunities. Epic 2.5 makes that valuable.

## Supported knowledge types (MVP)

| Type | Examples |
|------|----------|
| `proposal` | Past client proposals |
| `rfp` | RFP documents, solicitations |
| `case_study` | Portfolio / case studies |
| `sop` | Web process, print process, install, wrap, SEO |
| `rate_sheet` | Hourly rates, pricing |
| `brand_guide` | Brand guidelines, voice |
| `template` | Proposal / email templates |
| `faq` | FAQs, objection handling |
| `capabilities` | Capabilities decks |
| `other` | Anything else |

## MVP scope

1. **Navigation** — Knowledge in main nav
2. **`/knowledge`** — list, filter by type, search title/content
3. **`/knowledge/new`** — paste/manual entry + file upload placeholder (TXT/MD parsed; PDF/DOCX metadata only)
4. **`/knowledge/[id]`** — detail, chunks preview, link to opportunities
5. **`/knowledge/ask`** — keyword retrieval Q&A with source references
6. **Schema** — `knowledge_items`, `knowledge_chunks`, `opportunity_knowledge_links`
7. **Persistence** — JSON file fallback (dev) + Supabase (production)
8. **Chunking** — simple paragraph/size-based split
9. **Retrieval** — keyword match (no OpenAI / embeddings yet)
10. **Opportunity links** — attach knowledge items to opportunities

## Non-goals (Epic 2.5)

- Autonomous agents (Scout, Analyst, Proposal)
- External scraping (NYSCR, SAM.gov, etc.)
- Proposal generation
- OpenAI / paid API dependency
- PDF/DOCX full text extraction (placeholder only)
- Vector embeddings / RAG (placeholder hooks only)
- Supabase Storage binary upload (documented path; MVP stores text in DB)

## Supabase Storage (future)

When binary upload is enabled:

```
Bucket: knowledge
Path:  {tenant_id}/{knowledge_item_id}/{filename}
```

Run `deploy-v0.2.5-knowledge.sql` in SQL Editor after v0.2 schema.

## Exit criteria

- [ ] Add 10 real ninety two assets (paste or TXT/MD upload)
- [ ] Ask “what is our web process?” or “what rates do we use?” → grounded answer with sources
- [ ] Link a knowledge item to an opportunity
- [ ] Typecheck, lint, build pass

## Future (post–Epic 2.5)

- Embeddings + semantic RAG (`embedding vector` column placeholder)
- Supabase Storage for PDF/DOCX
- Epic 3: Signal Importer attaches source docs to Knowledge automatically
- Agents read Knowledge via shared retrieve API

## Linear

- Epic 2.5: Knowledge Engine (create in Linear when approved)
- Blocks: NIN-6 Signal Engine
