#!/usr/bin/env bun
/**
 * Thin CLI demo: load synthetic corpus, run three PRD example queries, print results.
 * No Gmail credentials required. Uses offline LexicalEmbedder + ExtractiveChatModel by default.
 *
 * Usage: bun run src/cli.ts
 */
import { ExtractiveChatModel } from "./adapters/extractive-chat.ts";
import { LexicalEmbedder } from "./adapters/lexical-embedder.ts";
import { EmailSearch } from "./email-search.ts";
import { loadSyntheticEmails } from "./fixtures/emails.ts";
import { lastMonthRange, REFERENCE_TODAY } from "./fixtures/golden.ts";

async function main(): Promise<void> {
  const emails = loadSyntheticEmails();
  const search = new EmailSearch({
    embedder: new LexicalEmbedder(),
    chat: new ExtractiveChatModel(),
    defaultLowConfidenceThreshold: 0.18,
  });

  console.log(`Indexing ${emails.length} synthetic emails (offline models)…`);
  await search.index(emails);
  console.log(`Indexed ${search.size} emails.\n`);

  const month = lastMonthRange(REFERENCE_TODAY);
  const queries: Array<{
    label: string;
    query: string;
    filters?: { dateFrom?: Date; dateTo?: Date };
  }> = [
    {
      label: "invoice from last month",
      query: "invoice",
      filters: month,
    },
    {
      label: "interview invitation",
      query: "interview invitation",
    },
    {
      label: "partnership proposal",
      query: "partnership proposal",
    },
  ];

  for (const q of queries) {
    console.log("=".repeat(72));
    console.log(`Query intent: ${q.label}`);
    console.log(`Library query: ${JSON.stringify(q.query)}`);
    if (q.filters) {
      console.log(
        `Filters: dateFrom=${q.filters.dateFrom?.toISOString()} dateTo=${q.filters.dateTo?.toISOString()}`,
      );
    } else {
      console.log("Filters: (none)");
    }

    const result = await search.search(q.query, q.filters);
    console.log(`\nlowConfidence: ${result.lowConfidence}`);
    console.log("\nAnswer:");
    console.log(result.answer);
    console.log("\nCitations:");
    for (const c of result.citations) {
      console.log(
        `  - ${c.emailId}  score=${c.score.toFixed(4)}${c.snippet ? `  snippet=${JSON.stringify(c.snippet)}` : ""}`,
      );
    }
    console.log("");
  }

  console.log("Done. No Gmail credentials used.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
