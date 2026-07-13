---
id: 0001
title: Day 8 — Embeddings are vectors you can measure distance on
date: 2026-07-13
topic: embeddings
status: active
---

## Context

Day 8 of the 30-day AI learning plan: _Embeddings_. Build a simple semantic search over
notes. The repo's PRD is a RAG email-search library, so embeddings are its literal
foundation.

## What I learned (non-obvious insights)

1. **An embedding is just a coordinate.** Text → fixed-length number vector. The magic is
   not the vector itself but the _distance metric_ we run on it. Nearby = similar meaning.
   This reframes "search" as "geometry."

2. **Cosine similarity is the workhorse.** With normalized vectors it's the dot product,
   range [-1, 1]. We rank by it. Learned this by writing `day8/cosine.ts` from scratch
   rather than importing a library — the 8-line loop is the whole concept.

3. **"Semantic" only arrives with a real model.** The library's `LexicalEmbedder`
   (hashed bag-of-words) matches _words_, not meaning — queries like "money clients owe
   us" would never reach the invoice note. Only a true embedding model (SBERT) closes that
   gap. This was the "aha" that made the PRD's RAG design click.

## Evidence

- `day8/main.ts` run output: 5 meaning-based queries, each ranking the correct note #1
  with a clear margin (e.g. "documents before going to another country" → passport 0.426
  vs next-best 0.153). Zero word overlap between query and target note in several cases.

## What to revisit / open questions

- Interpretability of dimensions; how `top-k` and a low-confidence threshold should be
  chosen for the email library (PRD open question §9).
- Whether a local model stays fast enough at 20–50 emails (it does — trivial at this size).
