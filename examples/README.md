# Examples

These examples show how to use the **semantic email search** library described in
[`PRD.md`](../PRD.md). They follow the non-normative API in PRD §7 and the decisions in
[`doc/adr/0001-semantic-email-search-library.md`](../doc/adr/0001-semantic-email-search-library.md).

> Note: the library is not implemented yet. These files mirror the _intended_ public API
> so callers can design against it. Once `src/` exists, swap the import path to the real
> package entrypoint.

## Files

- [`basic-usage.ts`](./basic-usage.ts) — ingest a small corpus, ask a question, get an answer + citations.
- [`invoice-last-month.ts`](./invoice-last-month.ts) — "invoice from last month" via a semantic query + `dateFrom`/`dateTo` filters (the library never parses "last month" itself).
- [`custom-provider.ts`](./custom-provider.ts) — plug in your own `Embedder` / `ChatModel` (provider-agnostic core).
- [`low-confidence.ts`](./low-confidence.ts) — read the `lowConfidence` flag and surface a warning without losing the answer.

## Key rules these examples respect

- **No Gmail, no UI** — callers pass `Email[]` in and get `SearchResult` out.
- **Time is explicit** — date windows come from the caller via `SearchFilters`, not from parsing natural language (PRD §5, ADR D3).
- **Hybrid RAG** — retrieval runs on summary embeddings; the answer is generated from full bodies of the top‑k hits (ADR D4).
- **Provider-agnostic** — core depends only on `Embedder` and `ChatModel` interfaces (ADR D5).
- **Best-effort on weak matches** — a low score sets `lowConfidence: true` but still returns an answer (ADR D8).
