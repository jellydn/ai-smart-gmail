# 1. Semantic email search library architecture

Date: 2026-07-13

## Status

Accepted

## Context

We are building the foundation for **AI Gmail search**: users ask natural-language questions such as “invoice from last month”, “interview invitation”, or “partnership proposal”, and get useful results from their mail.

For the first slice we only have a **small corpus (20–50 emails)** and need to prove the approach before investing in Gmail OAuth, sync, or a full product UI. Several architectural forks change the shape of the codebase:

1. **Product surface** — CLI spike, web app, Gmail-connected tool, or reusable library?
2. **Output shape** — ranked hits only, hits + explanations, or grounded answers with citations?
3. **Time language** — should the core parse “last month”, or should structured filters own that?
4. **What we index** — full bodies, summaries, or both?
5. **Where models run** — fixed cloud vendor, local-only, or pluggable providers?
6. **How we prove quality** — manual demos vs automated golden evals?
7. **Weak retrieval** — refuse, still answer, or let the caller configure policy?

These choices were decided in a spec interview (see [PRD.md](../../PRD.md)).

## Decision

We will implement a **provider-agnostic TypeScript library** that performs **hybrid RAG** over an in-memory email corpus and returns an **answer with citations**, with **metadata filters** for structured constraints and **low-confidence best-effort** behavior when matches are weak.

### D1 — Library / API first

- Public API accepts emails (and optional precomputed summaries) and exposes search/ask.
- **No** Gmail OAuth, sync, or product UI in v1.
- A thin CLI demo may wrap the library for fixtures only.
- Future Gmail product maps messages → `Email` and owns UX, auth, and NL date parsing.

### D2 — Answer + citations (RAG), not pure retrieval

- Primary result is a **natural-language answer** plus **citations** (`emailId`, `score`, optional snippet).
- Query path = **retrieve → generate**, not embeddings-only ranking.
- Generation must be grounded in retrieved email bodies (prompt-constrained to provided context).

### D3 — Metadata filters for time (and future structured constraints)

- Library **does not** parse phrases like “last month”.
- Callers pass explicit filters (at least `dateFrom` / `dateTo`).
- Example: invoice intent → semantic query about invoices + caller-supplied last-month window.
- Keeps the library boundary clean, deterministic, and easy to test.

### D4 — Hybrid content model (summary retrieve, body answer)

- **Retrieve** on embeddings of **summaries** (plus short fields as needed, e.g. subject).
- **Expand** top‑k hits to **full bodies** for the answer prompt.
- If `summary` is missing at ingest, the library may generate one via a model adapter.
- Balances cost/noise of long threads against need for exact details in answers.

### D5 — Provider-agnostic model interfaces

- Core depends on **`Embedder`** and **`ChatModel`** (names may vary) interfaces only.
- Ship or document **one default cloud adapter**; local (e.g. Ollama) can plug in later without core rewrites.
- Avoid baking a single vendor into the search pipeline.

### D6 — Synthetic corpus now; real loaders later

- v1 demos and tests use **hand-authored / generated fixtures** (~20–50 messages) covering invoices, interview invites, partnership proposals, and noise.
- Design ingest so Gmail/export loaders can be added later without changing the search API.

### D7 — Eval harness + golden fixtures

- Acceptance is not “demo looks fine” alone.
- Golden set: query (+ filters) → expected citation email IDs and must-include answer facts.
- Runnable in CI via fixed models, recorded responses, or mocked LLM paths.

### D8 — Best-effort answers with low-confidence flag

- When retrieval quality is below threshold, still return a best-effort answer and citations.
- Set **`lowConfidence: true`** so hosts can warn, retry, or change UX.
- Prefer this over hard refuse-by-default for v1; thresholds tuned via eval.

### Pipeline (normative shape)

```
emails → normalize → ensure summary → embed summaries → store + metadata
query + filters → filter candidates → semantic top-k → load bodies
             → generate answer + citations → set lowConfidence
```

## Alternatives considered

| Option | Why not (for v1) |
|--------|------------------|
| Ranked list only (no generation) | Does not match product direction of AI Gmail search answers |
| Answer without citations | Harder to trust; poor path to a mail client UX |
| Local prototype / notebook only | Harder to reuse when Gmail integration arrives |
| Mini web app first | Premature product surface before retrieval quality is proven |
| Live Gmail import first | OAuth, privacy, and flaky demos before the core API exists |
| Semantic-only time handling | “Last month” fails often with pure embeddings |
| Auto-parse time phrases in library | Ambiguous NLP, timezone edge cases, harder tests; belongs in app layer later |
| Full-body-only index | Costly and noisy for long threads at query time |
| Summaries-only answer context | Drops amounts, exact wording, links needed for good answers |
| Hardcoded single LLM vendor | Blocks local/private and multi-provider use |
| Refuse on weak match | Safer against hallucination, but loses partial utility; we chose flag instead |
| Manual demo-only quality bar | Regresses silently when prompts/models change |

## Consequences

### Positive

- Clear module boundary: **search core** vs **Gmail app** vs **date-phrase UX**.
- Citations and filters make behavior **testable** with synthetic goldens.
- Hybrid RAG keeps early corpus cheap while preserving answer detail.
- Provider interfaces allow cloud now and private/local later.
- Low-confidence flag gives product control without silent hallucination-as-truth.

### Negative / risks

- RAG adds **latency and cost** vs pure retrieval.
- Caller must implement “last month” (or we add a separate helper later outside core).
- Summary quality becomes a dependency of retrieval quality.
- Cloud default adapters imply **email content may leave the machine** until local adapters are used.
- Best-effort answers can still be wrong; hosts must surface `lowConfidence` in UX.
- In-memory 20–50 design may need a different index when scaling to full mailboxes.

### Follow-ups

- Choose default embed + chat models and document env vars.
- Define score semantics and default low-confidence threshold via eval.
- Decide message vs thread as citation unit when real Gmail threads appear.
- Add Gmail/export loader and optional NL date parser in the **application** layer (not this core decision).

## References

- [PRD.md](../../PRD.md) — product requirements and user stories derived from the same interview
