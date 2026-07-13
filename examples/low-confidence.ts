// low-confidence.ts
// Weak retrieval still returns a best-effort answer, but sets `lowConfidence`.
// Hosts decide the UX — warn, retry, or fall back (ADR D8, FR-11).

import { createEmailSearch, type Email, type SearchResult } from "semantic-email-search";

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
  const search = createEmailSearch();
  await search.index(corpus);

  // A query with no real match in the corpus.
  const result: SearchResult = await search.ask("quarterly revenue forecast for Q3");

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

main();
