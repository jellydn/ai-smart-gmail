# AI Smart Gmail — Semantic Email Search Library

A reusable TypeScript library for **hybrid RAG** over a small in-memory email corpus:
retrieve relevant emails by _meaning_, then generate a grounded answer with citations.

> This repo is also the lab for a **30-day "master AI" learning journey** (see
> [`MISSION.md`](./MISSION.md)). Day 8 built the [`day8/`](./day8) semantic-search demo
> that this library's retrieval is based on.

## Status

Foundation / WIP. v1 has **no Gmail connection and no UI** — callers pass `Email[]` in and
get a structured `{ answer, citations, lowConfidence }` result out. See
[`PRD.md`](./PRD.md) and the architecture decision
[`doc/adr/0001-semantic-email-search-library.md`](./doc/adr/0001-semantic-email-search-library.md).

## Quick start

```bash
bun install
bun test          # unit + golden eval (offline, no API keys)
bun run demo      # CLI: three PRD example queries on synthetic fixtures
bun run typecheck # tsc --noEmit
```

## Library usage

```ts
import {
  EmailSearch,
  LexicalEmbedder,
  ExtractiveChatModel,
  // or createOpenAIProviders() when OPENAI_API_KEY is set
} from "ai-smart-gmail";

const search = new EmailSearch({
  embedder: new LexicalEmbedder(),
  chat: new ExtractiveChatModel(),
});

await search.index(emails);
const result = await search.search("invoice", {
  dateFrom: new Date("2026-06-01"),
  dateTo: new Date("2026-06-30T23:59:59.999Z"),
});
// result.answer, result.citations, result.lowConfidence
```

### Providers

| Adapter                                                          | Role                                            |
| ---------------------------------------------------------------- | ----------------------------------------------- |
| `LexicalEmbedder` + `ExtractiveChatModel`                        | Offline default for tests/CLI (no API keys)     |
| `OpenAIEmbedder` + `OpenAIChatModel` / `createOpenAIProviders()` | Documented **cloud** default (`OPENAI_API_KEY`) |

> **Why two embedders?** `LexicalEmbedder` is a hashed bag-of-words embedder — fast and
> offline, but it matches _words_, not meaning. The retrieval quality of a real product
> needs a semantic model (see the [`day8/`](./day8) demo, which uses a local
> Sentence-Transformers model). The core never hardcodes a vendor — implement the
> `Embedder` / `ChatModel` interfaces to swap providers.

**Privacy:** cloud adapters send email text to the remote API. Use local/offline adapters
when that is not acceptable.

### Defaults

- `DEFAULT_TOP_K = 5` — full bodies expanded for generation
- `DEFAULT_LOW_CONFIDENCE_THRESHOLD = 0.18` — absolute cosine similarity floor (tunable)

## Scripts

| Script              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `bun test`          | Unit + golden eval (no live keys)            |
| `bun run eval`      | Golden cases only                            |
| `bun run demo`      | CLI: three PRD queries on synthetic fixtures |
| `bun run typecheck` | `tsc --noEmit`                               |

## Repository map

| Path                                                        | What                                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/`                                                      | The semantic email search library (RAG core, adapters, fixtures, eval)       |
| `examples/`                                                 | Usage examples matching the PRD conceptual API                               |
| `day8/`                                                     | Day 8 learning demo: real local embeddings + cosine vector search over notes |
| `doc/adr/`                                                  | Architecture decision record (ADR-0001)                                      |
| `lessons/`, `reference/`, `learning-records/`, `MISSION.md` | 30-day AI learning workspace                                                 |

## License

See [`LICENSE`](./LICENSE).
