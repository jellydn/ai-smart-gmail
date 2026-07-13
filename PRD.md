# PRD: Semantic Email Search (AI Gmail Search Foundation)

**Status:** Draft from spec interview  
**Date:** 2026-07-13  
**Related:** [ADR-0001](doc/adr/0001-semantic-email-search-library.md)

## 1. Introduction / Overview

Build a **reusable TypeScript library** that answers natural-language questions about a small email corpus (20–50 messages) using semantic retrieval plus grounded generation (**answer + citations**).

This is the foundation for a later **AI Gmail search** product. v1 does **not** connect to Gmail or ship a UI: callers pass emails in, get a structured answer out. Time phrases like “last month” are handled via **metadata filters** supplied by the caller, not by the library parsing natural language dates.

### Target example queries

| Intent | How the library is called |
|--------|---------------------------|
| “invoice from last month” | Semantic query about invoices + `dateFrom` / `dateTo` for last month |
| “interview invitation” | Semantic query only |
| “partnership proposal” | Semantic query only |

## 2. Goals

- Provide a clean, reusable `search`/`ask` API over an in-memory email corpus.
- Return a **natural-language answer grounded in retrieved emails**, with **citations** (email IDs + scores).
- Support **metadata filters** (at least date range) so structured constraints stay explicit and testable.
- Use a **hybrid content model**: retrieve on summaries, expand top‑k full bodies into the answer prompt.
- Stay **provider-agnostic** for embeddings and chat models (pluggable interfaces; one default cloud adapter).
- Prove quality with **synthetic fixtures** and an **eval harness** (golden queries → expected citations / facts).
- Flag **low confidence** when matches are weak, while still returning a best-effort answer.

## 3. User Stories

### US-001: Normalize and optionally summarize emails

**Description:** As a library consumer, I want emails normalized into a consistent shape (and summarized if needed) so retrieval works without me pre-processing everything.

**Acceptance Criteria:**

- [ ] Public `Email` type includes at least: `id`, `subject`, `from`, `date`, `body`, optional `summary`
- [ ] If `summary` is missing, the library can generate and attach one (via pluggable chat model) before indexing
- [ ] Invalid/missing required fields fail with clear errors
- [ ] Typecheck/lint passes

### US-002: Index corpus for semantic retrieval

**Description:** As a library consumer, I want to index 20–50 emails once so subsequent queries are fast and filterable.

**Acceptance Criteria:**

- [ ] Index embeds summary text (and agreed short fields such as subject) via pluggable embedder
- [ ] Index stores metadata needed for filters (`date`, `id`, etc.)
- [ ] Re-index / replace corpus API is defined (at least “build index from emails”)
- [ ] Typecheck/lint passes

### US-003: Search with answer + citations

**Description:** As a library consumer, I want to ask a natural-language question and receive an answer grounded in my emails, with citations I can display or open later.

**Acceptance Criteria:**

- [ ] API returns `{ answer, citations, lowConfidence }` (field names may vary slightly but semantics match)
- [ ] Each citation includes at least `emailId` and `score`
- [ ] Answer is generated only from retrieved top‑k full bodies (no free-floating claims without retrieval context)
- [ ] Empty corpus returns a defined response (error or no-match path documented)
- [ ] Typecheck/lint passes

### US-004: Metadata filters (date range)

**Description:** As a library consumer, I want to pass date filters so “invoice from last month” is implemented as semantic + time window without the library parsing English dates.

**Acceptance Criteria:**

- [ ] `SearchFilters` supports at least `dateFrom` and `dateTo`
- [ ] Filters are applied **before or during** retrieval (results outside the window are not cited)
- [ ] Queries without filters search the full corpus
- [ ] Typecheck/lint passes

### US-005: Hybrid retrieval (summary → full body)

**Description:** As a product, we want cheap topical retrieval on summaries while answering from full email bodies for accuracy.

**Acceptance Criteria:**

- [ ] Similarity search runs over summary (or summary+subject) embeddings
- [ ] Top‑k hits expand to full `body` text for the generation step
- [ ] k is configurable (sensible default documented)
- [ ] Typecheck/lint passes

### US-006: Provider-agnostic model adapters

**Description:** As a library consumer, I want to plug in my own embedder and chat model so I can use cloud or local providers later.

**Acceptance Criteria:**

- [ ] Interfaces for `Embedder` and `ChatModel` (or equivalent) are public
- [ ] At least one default cloud adapter implementation is provided or documented
- [ ] Core search logic does not hardcode a single vendor SDK outside adapters
- [ ] Typecheck/lint passes

### US-007: Synthetic fixtures + eval harness

**Description:** As a developer, I want golden-set evaluations so the three target intents stay correct as the library evolves.

**Acceptance Criteria:**

- [ ] ~20–50 synthetic emails covering invoices (with dates), interview invites, partnership proposals, and noise
- [ ] Golden cases for the three example intents (and at least one hard-negative / weak-match case)
- [ ] Eval asserts expected citation email IDs and must-include answer facts
- [ ] Eval runnable in CI (fixed model, recorded responses, or mocked LLM path documented)
- [ ] Typecheck/lint passes

### US-008: Low-confidence best-effort answers

**Description:** As a library consumer, I want weak matches flagged so my app can warn the user without losing a possible answer.

**Acceptance Criteria:**

- [ ] When retrieval scores / margin fall below a threshold, `lowConfidence` is `true`
- [ ] Library still returns best-effort `answer` + citations when possible
- [ ] Threshold is configurable or documented as a constant to tune via eval
- [ ] Typecheck/lint passes

### US-009: Thin CLI demo (optional wrapper)

**Description:** As a developer, I want a minimal CLI that loads fixtures, applies last-month filters for the invoice query, and prints answer + citations.

**Acceptance Criteria:**

- [ ] CLI loads synthetic corpus
- [ ] Demonstrates all three example queries (invoice uses date filters)
- [ ] Prints answer, citations, and lowConfidence flag
- [ ] Does not require Gmail credentials

## 4. Functional Requirements

- **FR-1:** The library must accept an array of emails and build a searchable index.
- **FR-2:** The library must expose a search/ask function: `(query, filters?, options?) → SearchResult`.
- **FR-3:** SearchResult must include a natural-language `answer`, `citations[]`, and `lowConfidence`.
- **FR-4:** Citations must reference corpus email IDs present in the filtered retrieval set.
- **FR-5:** Date filters (`dateFrom`, `dateTo`) must restrict which emails are eligible for retrieval/citation.
- **FR-6:** Retrieval must use embeddings of summaries (hybrid pipeline); generation must use full bodies of top‑k.
- **FR-7:** Embeddings and generation must go through pluggable provider interfaces.
- **FR-8:** If summary is absent, the library may generate one at ingest time via the chat (or dedicated) model.
- **FR-9:** Synthetic fixture corpus and golden eval cases must cover the three target intents.
- **FR-10:** Eval harness must be able to assert expected citation IDs and required factual substrings/fields in answers.
- **FR-11:** Low-confidence detection must set a boolean flag without suppressing the answer by default.

## 5. Non-Goals (Out of Scope for v1)

- Gmail OAuth, live sync, or Gmail API loaders
- Web UI / mobile UI
- Parsing natural-language time phrases (“last month”, “yesterday”) inside the library
- Attachment content, OCR, or calendar invite deep parsing
- Multi-tenant hosting, auth, or multi-mailbox accounts
- Full thread reconstruction / conversation view (unless needed later for citations)
- Production-grade rate limiting, quotas, or multi-user security review

## 6. Design Considerations

- **No product UI in v1** — API + CLI demo only.
- Later AI Gmail search app owns: OAuth, “last month” parsing, result presentation, and privacy UX.
- Keep public types stable so a future Gmail loader can map messages → `Email` without changing search.

## 7. Technical Considerations

- **Stack (recommended):** TypeScript library, Bun-friendly scripts/tests where practical.
- **Pipeline:** ingest → summarize (if needed) → embed summaries → filter metadata → top‑k → expand bodies → generate answer → confidence flag.
- **Corpus size:** optimized for 20–50 emails in memory; design should not assume millions of messages yet, but keep interfaces open.
- **Privacy:** default cloud adapters mean email text may leave the machine; document this; local adapters are a future swap via interfaces.
- **Architecture decisions:** see [ADR-0001](doc/adr/0001-semantic-email-search-library.md).

### Conceptual API (non-normative)

```ts
type Email = {
  id: string
  subject: string
  from: string
  date: Date
  body: string
  summary?: string
}

type SearchFilters = {
  dateFrom?: Date
  dateTo?: Date
}

type Citation = {
  emailId: string
  score: number
  snippet?: string
}

type SearchResult = {
  answer: string
  citations: Citation[]
  lowConfidence: boolean
}
```

## 8. Success Metrics

- Golden eval passes for the three target intents (correct citation IDs + required facts).
- Hard-negative / weak-match case sets `lowConfidence: true`.
- Library has no hard dependency on Gmail or a UI framework.
- A new provider can be added by implementing interfaces only (no core rewrites).
- Demo CLI can run the three queries against fixtures without live credentials.

## 9. Open Questions

- Default cloud provider and model IDs (embed + chat)?
- Exact confidence threshold and score definition (absolute vs margin)?
- Citation unit: individual message vs thread?
- Should multi-language emails be in the synthetic corpus for v1?
- PII redaction before cloud calls when real Gmail data is added later?
- Summary generation: same chat model or cheaper/smaller model?

## 10. Delivery Plan (suggested)

1. Scaffold TypeScript package + public types + provider interfaces  
2. Synthetic corpus (~20–50 emails)  
3. Ingest + summary + embed + in-memory index  
4. Filter → retrieve → expand → generate → lowConfidence  
5. Golden eval harness  
6. Thin CLI demo  
7. Later: Gmail loader + app-layer date phrase parsing + UI  

## 11. Spec Interview Decisions (source of truth)

| Area | Decision |
|------|----------|
| Deliverable | Library / API first |
| Result shape | Answer + citations (RAG) |
| Time constraints | Metadata filters API (caller owns “last month”) |
| Content model | Hybrid: retrieve on summary, answer from full body |
| Models | Provider-agnostic (embedder + chat) |
| Demo data | Synthetic now; real loaders later |
| Quality bar | Eval harness + golden fixtures |
| Weak matches | Best-effort answer + `lowConfidence` |
