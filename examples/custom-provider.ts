// examples/custom-provider.ts
// Plug in your own embedder and chat model. The core depends only on the
// `Embedder` and `ChatModel` interfaces — no vendor SDK is hardcoded (ADR D5).
// Local providers (e.g. Ollama) swap in the same way without core changes.
//
// Run:  bun run examples/custom-provider.ts

import {
  type ChatMessage,
  type ChatModel,
  type Email,
  EmailSearch,
  type Embedder,
} from "../src/index.ts";

// Minimal stand-ins for the provider interfaces. Replace with real calls.
class MyEmbedder implements Embedder {
  async embed(texts: string[]): Promise<number[][]> {
    // Call your local embedding server here.
    return texts.map(() => new Array(256).fill(0));
  }
}

class MyChat implements ChatModel {
  async complete(messages: ChatMessage[]): Promise<string> {
    // Call your local LLM here.
    const last = messages[messages.length - 1]?.content ?? "";
    return `Answer grounded in: ${last.slice(0, 60)}…`;
  }
}

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
  const search = new EmailSearch({
    embedder: new MyEmbedder(),
    chat: new MyChat(),
  });

  await search.index(corpus);

  const result = await search.search("partnership proposal");
  console.log(result.answer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
