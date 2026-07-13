// examples/invoice-last-month.ts
// "invoice from last month" = semantic query + a caller-supplied date window.
// The library never parses "last month" — the caller owns that (PRD §5, ADR D3).
//
// Run:  bun run examples/invoice-last-month.ts

import {
  EmailSearch,
  ExtractiveChatModel,
  LexicalEmbedder,
  lastMonthRange,
  loadSyntheticEmails,
} from "../src/index.ts";

async function main() {
  const search = new EmailSearch({
    embedder: new LexicalEmbedder(),
    chat: new ExtractiveChatModel(),
  });

  // Synthetic fixtures stand in for a real corpus (no Gmail credentials needed).
  await search.index(loadSyntheticEmails());
  console.log(`Indexed ${search.size} emails.\n`);

  // The caller computes "last month" however it wants — here via the library helper
  // (which defaults to the corpus reference date). Filters are passed explicitly.
  const result = await search.search("invoice", lastMonthRange());

  console.log(result.answer);
  for (const c of result.citations) {
    console.log(`- ${c.emailId}  score=${c.score.toFixed(3)}`);
  }
  if (result.lowConfidence) {
    console.log("(low confidence — treat the answer as best-effort)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
