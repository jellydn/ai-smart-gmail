# Examples

Usage examples for the **semantic email search** library, aligned with the real API
used in [`src/cli.ts`](../src/cli.ts). Each file is runnable with Bun and imports the
library directly from `../src/index.ts`.

## Files

- [`basic-usage.ts`](./basic-usage.ts) — index a small corpus, `search("interview invitation")`, print answer + citations.
- [`invoice-last-month.ts`](./invoice-last-month.ts) — "invoice from last month" via a semantic query + `lastMonthRange()` date filter (the library never parses "last month" itself).
- [`custom-provider.ts`](./custom-provider.ts) — implement your own `Embedder` / `ChatModel` interfaces (provider-agnostic core).
- [`low-confidence.ts`](./low-confidence.ts) — read the `lowConfidence` flag and surface a warning without losing the answer.

## Run

```bash
bun run examples/basic-usage.ts
bun run examples/invoice-last-month.ts
bun run examples/custom-provider.ts
bun run examples/low-confidence.ts
```

All examples use the offline `LexicalEmbedder` + `ExtractiveChatModel` adapters, so no
API keys are required. For cloud embeddings/chat, swap in `createOpenAIProviders()`.

## Real API shape (from `src/`)

```ts
import {
  EmailSearch,
  LexicalEmbedder,
  ExtractiveChatModel,
} from "ai-smart-gmail";

const search = new EmailSearch({
  embedder: new LexicalEmbedder(),
  chat: new ExtractiveChatModel(),
});

await search.index(emails); // emails: Email[]
const result = await search.search(
  // result: { answer, citations, lowConfidence }
  "invoice", // query
  { dateFrom, dateTo }, // optional SearchFilters
  { topK: 5, lowConfidenceThreshold: 0.18 }, // optional SearchOptions
);
```
