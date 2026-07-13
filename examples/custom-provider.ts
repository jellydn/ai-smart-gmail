// custom-provider.ts
// Plug in your own embedder / chat model. The core depends only on the
// `Embedder` and `ChatModel` interfaces — no vendor SDK is hardcoded (ADR D5).
// Local providers (e.g. Ollama) swap in the same way without core changes.

import {
  type ChatModel,
  createEmailSearch,
  type Email,
  type Embedder,
} from "semantic-email-search";

// Minimal interfaces matching the PRD provider-agnostic contract.
// (Exact signatures are finalized in implementation; this shows the shape.)
const localEmbedder: Embedder = {
  async embed(texts: string[]): Promise<number[][]> {
    // Call your local embedding server here.
    return texts.map(() => new Array(384).fill(0));
  },
};

const localChat: ChatModel = {
  async complete(prompt: string): Promise<string> {
    // Call your local LLM here.
    return `Answer based on: ${prompt.slice(0, 40)}…`;
  },
};

const corpus: Email[] = [
  {
    id: "e1",
    subject: "Partnership proposal",
    from: "bd@northwind.io",
    date: new Date("2026-06-20"),
    body: "We propose a revenue-share partnership to co-sell our API analytics product.",
    summary: "Northwind proposes a revenue-share partnership co-selling API analytics.",
  },
];

async function main() {
  const search = createEmailSearch({
    embedder: localEmbedder,
    chatModel: localChat,
  });

  await search.index(corpus);

  const result = await search.ask("partnership proposal");
  console.log(result.answer);
}

main();
