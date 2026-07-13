// examples/low-confidence.ts
// Weak retrieval still returns a best-effort answer, but sets `lowConfidence`.
// Hosts decide the UX — warn, retry, or fall back (ADR D8, FR-11).
//
// Run:  bun run examples/low-confidence.ts

import { type Email, EmailSearch, ExtractiveChatModel, LexicalEmbedder } from "../src/index.ts";

const corpus: Email[] = [
  {
    id: "e1",
    subject: "Lunch plans",
    from: "friend@example.com",
    date: new Date("2026-06-15"),
    body: "Want to grab lunch on Friday?",
    summary: "Friend suggests lunch on Friday.",
  },
];

async function main() {
  const search = new EmailSearch({
    embedder: new LexicalEmbedder(),
    chat: new ExtractiveChatModel(),
  });

  await search.index(corpus);

  // A query with no real match in the corpus.
  const result = await search.search("quarterly revenue forecast for Q3");

  if (result.lowConfidence) {
    console.warn("Low confidence: no strong match found. Showing best-effort answer.");
  }

  console.log(result.answer);
  if (result.citations.length > 0) {
    console.log(
      "Citations:",
      result.citations.map((c) => c.emailId),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
