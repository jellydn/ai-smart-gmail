# AGENTS.md

Semantic email search: a **provider-agnostic TypeScript library** (RAG) that answers
natural-language questions over an in-memory email corpus (~20–50 messages) with an
answer plus citations. v1 has **no Gmail connection and no UI** — callers pass emails
in and get a structured result out.

Source of truth for requirements is `PRD.md`; architecture decisions are
`doc/adr/0001-semantic-email-search-library.md`. Library lives under `src/`
(`EmailSearch`, providers, fixtures, CLI). Prefer Bun: `bun test`, `bun run demo`.

## Scope boundaries (easy to violate — do NOT cross in v1)

- **No Gmail OAuth, sync, or Gmail API loaders.** Ingest takes an array of `Email` objects.
- **No product UI / web app.** v1 is a library + a thin CLI demo over fixtures only.
- **Do NOT parse natural-language time phrases** ("last month", "yesterday") in the
  library. Time constraints are explicit `dateFrom` / `dateTo` filters supplied by the
  caller. "Invoice from last month" = semantic query + caller-supplied date window.
- **Do NOT hardcode a single LLM vendor in the search core.** Depend only on `Embedder`
  and `ChatModel` interfaces; ship/document one default cloud adapter. Local providers
  (e.g. Ollama) must be addable via interfaces without core rewrites.
- **Do NOT refuse on weak matches by default.** Return a best-effort answer with
  `lowConfidence: true`; let the host decide UX. Threshold is tuned via eval.

## Core design (from ADR-0001)

- **Hybrid RAG pipeline:**
  `emails → normalize → ensure summary → embed summaries → store + metadata`
  `query + filters → filter candidates → semantic top-k → load bodies → generate answer + citations → lowConfidence`.
- **Retrieve on summary embeddings** (optionally + subject); **answer from full bodies**
  of the top-k hits. If `summary` is missing at ingest, generate one via a model adapter.
- **Result shape:** `{ answer, citations[], lowConfidence }`. Each citation has at least
  `emailId` and `score`. Citations must reference IDs present in the filtered retrieval set.
- **Quality bar is the eval harness, not demos.** Build golden fixtures (~20–50 synthetic
  emails: invoices with dates, interview invites, partnership proposals, noise) and assert
  expected citation IDs + required answer facts. Must run in CI (fixed models, recorded
  responses, or mocked LLM path).
- **Stack:** TypeScript library, Bun-friendly scripts/tests where practical.

## Operational notes

- **Privacy:** default cloud adapters mean email text may leave the machine until local
  adapters are used — document this, don't hide it.
- **Open questions** (undecided, in PRD §9): default embed/chat model IDs, confidence
  threshold & score semantics, citation unit (message vs thread), summary model choice,
  multi-language corpus. Confirm before locking these in.
