# Day 8 — Semantic Notes Search

A self-contained, runnable demo of **embeddings + vector search** (the Day 8 build),
kept isolated from the main library in `src/` (built by another agent).

## What it shows

Turn a small set of notes into vectors with a **real local Sentence-Transformers model**
(`Xenova/all-MiniLM-L6-v2`, via `@huggingface/transformers` — no API key), then rank
notes by **cosine similarity** to a query. Queries use _different words_ than the notes to
prove we match on **meaning**, not keywords.

## Run it

```bash
cd day8
bun install      # first time: pulls @huggingface/transformers (~25MB model on first run)
bun start        # or: bun run main.ts
```

## Files

- `embedder.ts` — `SemanticEmbedder`: text → 384-d vector using a local model.
- `cosine.ts` — `cosineSimilarity`: the ranking function ([-1, 1]).
- `notes.ts` — the tiny corpus.
- `main.ts` — embed notes, run 5 meaning-based queries, print top-3 ranked notes.

## Why it matters

The main library's default `LexicalEmbedder` (in `src/adapters/lexical-embedder.ts`)
is a **hashed bag-of-words** embedder: it only matches shared keywords, so it cannot
"search by meaning." A real embedding model is what makes semantic search work — and
it is the foundation of the RAG pipeline the whole PRD is built on.
