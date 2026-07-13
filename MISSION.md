# Mission

**Why this exists:** The user is on a **30-day journey to master AI** (cronjob
`30-day-ai-learning`, job `9486e1788301`). Each day targets one building block; Day 8 is
**Embeddings**.

**The vehicle:** This repo (`ai-smart-gmail`) is the practical lab. Its `PRD.md` describes a
provider-agnostic TypeScript **semantic email search** library (RAG: retrieve relevant
emails by meaning, then generate a grounded answer with citations). The library is the
end goal; the 30-day lessons are how the user builds the skills to get there.

**How Day 8 fits:** Embeddings are the mathematical foundation of the whole product —
retrieval in a RAG system _is_ vector search over embeddings. Mastering "search by meaning"
today is what makes the email-search library possible later.

**Scope guard (from PRD §5):** v1 of the library has no Gmail connection and no UI. Keep
learning builds aligned to the library's documented boundaries.

> Mission can evolve as skills grow. Update this file and add a learning record if it does.
