// invoice-last-month.ts
// "invoice from last month" = semantic query about invoices + a caller-supplied date window.
// The library does NOT parse "last month" — the caller owns that (PRD §5, ADR D3).

import { createEmailSearch, type Email, type SearchFilters } from "semantic-email-search";

const corpus: Email[] = [
  {
    id: "inv-0426",
    subject: "Invoice #0426 — April services",
    from: "billing@vendor.com",
    date: new Date("2026-06-28"),
    body: "Please find invoice #0426 for $4,200 covering April consulting services. Due 2026-07-12.",
    summary: "Vendor invoice #0426 for $4,200 of April consulting services, due 2026-07-12.",
  },
  {
    id: "inv-0399",
    subject: "Invoice #0399 — March services",
    from: "billing@vendor.com",
    date: new Date("2026-05-30"),
    body: "Invoice #0399 for $3,100 covering March consulting services. Due 2026-06-14.",
    summary: "Vendor invoice #0399 for $3,100 of March consulting services, due 2026-06-14.",
  },
];

// Caller computes "last month" however it wants (timezone, calendar month, rolling 30d...).
function lastMonthWindow(now = new Date()): SearchFilters {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed; "last month" is month - 1
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1); // exclusive upper bound
  return { dateFrom: start, dateTo: end };
}

async function main() {
  const search = createEmailSearch();
  await search.index(corpus);

  const result = await search.ask("invoice from last month", lastMonthWindow());

  console.log(result.answer);
  for (const c of result.citations) {
    console.log(`- ${c.emailId}`);
  }
}

main();
