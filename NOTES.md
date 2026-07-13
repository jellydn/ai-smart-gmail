# Notes

Scratchpad for user preferences and working observations during the 30-day AI learning.

## Day 8 — Embeddings (2026-07-13)

User is building toward the `ai-smart-gmail` RAG library while learning AI in 30 days.
Another agent (grok, "Smart Gmail" pane `wG:p7R`) is implementing the PRD library in
`src/` in parallel — keep learning builds isolated (use `day8/`) to avoid clobbering it.

### 3 bullet notes — what I learned

- An **embedding** is a fixed-length list of numbers (a point in N-dimensional space)
  that captures the _meaning_ of text; texts with similar meaning land close together,
  so "nearby in space" ≈ "similar in meaning."
- **Vector search = embed the query, then rank corpus items by cosine similarity**
  (dot product of unit vectors, range [-1, 1]); the highest score is the best semantic match.
- A **real embedding model** (Sentence-Transformers / `all-MiniLM-L6-v2`) matches by
  _meaning_ — queries with zero word overlap still rank the right note first — whereas a
  keyword/bag-of-words embedder only matches shared words. That semantic gap is the whole
  point of embeddings and the foundation of RAG retrieval.

## Open questions to revisit

- What does the 384-d vector actually encode? (dimensions aren't human-interpretable)
- How do we pick `top-k` and a confidence threshold for the email library?
