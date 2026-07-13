// examples/basic-usage.ts
// Ingest a small corpus and ask a natural-language question. Mirrors src/cli.ts.
//
// Run:  bun run examples/basic-usage.ts

import { type Email, EmailSearch, ExtractiveChatModel, LexicalEmbedder } from "../src/index.ts";

const corpus: Email[] = [
  {
    id: "e1",
    subject: "Interview invitation — Senior Engineer",
    from: "talent@acme.dev",
    date: new Date("2026-06-18"),
    body: "Hi, thanks for applying. We'd like to invite you to a technical interview next Tuesday at 10am.",
    summary: "Acme invites the candidate to a technical interview next Tuesday at 10am.",
  },
  {
    id: "e2",
    subject: "Partnership proposal",
    from: "bd@northwind.io",
    date: new Date("2026-06-20"),
    body: "We propose a revenue-share partnership to co-sell our API analytics product to your enterprise accounts.",
    summary:
      "Northwind proposes a revenue-share partnership co-selling API analytics to enterprise accounts.",
  },
];

async function main() {
  // Offline defaults: no API keys required.
  const search = new EmailSearch({
    embedder: new LexicalEmbedder(),
    chat: new ExtractiveChatModel(),
  });

  // Index once; subsequent queries are in-memory and fast.
  await search.index(corpus);
  console.log(`Indexed ${search.size} emails.\n`);

  const result = await search.search("interview invitation");

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
