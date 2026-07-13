# Resources

High-trust sources for the embeddings / vector-search topic. Lessons and reference docs
link here.

## Primary (recommended reading)

- **OpenAI — Embeddings guide**
  https://platform.openai.com/docs/guides/embeddings
  Clear explanation of what embeddings are, how to produce them, and how to use cosine
  similarity for search. Best first read.

- **Sentence Transformers (SBERT) documentation**
  https://www.sbert.net/
  The open-source family of embedding models we use locally (`all-MiniLM-L6-v2`).
  Covers training, model hub, and the "semantic" vs "lexical" distinction.

## Supporting

- **Hugging Face Transformers.js**
  https://huggingface.co/docs/transformers.js
  Lets us run the exact same SBERT models **in JavaScript / Bun**, fully offline after
  the first download. This is what `day8/embedder.ts` uses.

- **Cosine similarity** (math reference)
  https://en.wikipedia.org/wiki/Cosine_similarity
  The ranking function behind vector search. With unit-normalized vectors it equals the
  dot product; range [-1, 1], where 1 = same direction = similar meaning.

## In-repo

- `day8/` — the runnable Day 8 demo (real local embeddings + cosine search).
- `src/adapters/lexical-embedder.ts` — a _keyword_ embedder, shown here as the contrast
  case: it cannot search by meaning, only by shared words.
