import type { SearchFilters } from "../types.ts";

/**
 * Reference "today" for demos/eval: 2026-07-13 → last calendar month is June 2026.
 */
export const REFERENCE_TODAY = new Date("2026-07-13T12:00:00Z");

/** Inclusive-ish last-month window for June 2026 (UTC). */
export function lastMonthRange(today: Date = REFERENCE_TODAY): SearchFilters {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth(); // 0-based; July = 6 → last month = 5 (June)
  const dateFrom = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  // End of last month: day 0 of current month
  const dateTo = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { dateFrom, dateTo };
}

export type GoldenCase = {
  id: string;
  description: string;
  query: string;
  filters?: SearchFilters;
  /** At least one of these email ids must appear in citations. */
  expectedCitationIds: string[];
  /** Substrings that must appear in the answer (case-insensitive). */
  mustIncludeFacts: string[];
  /** When true, result.lowConfidence must be true. */
  expectLowConfidence?: boolean;
  /**
   * When set, none of these ids may appear in citations
   * (e.g. out-of-window invoices).
   */
  forbiddenCitationIds?: string[];
};

export const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "invoice-last-month",
    description: "Invoice intent with caller-supplied last-month date filters",
    query: "invoice",
    filters: lastMonthRange(),
    expectedCitationIds: ["inv-june-acme-01", "inv-june-orbit-02"],
    mustIncludeFacts: ["Acme Billing", "$1,240"],
    forbiddenCitationIds: ["inv-may-acme-old", "inv-april-noise"],
  },
  {
    id: "interview-invitation",
    description: "Interview invitation semantic query",
    query: "interview invitation",
    expectedCitationIds: ["interview-brightpath-01", "interview-northwind-02"],
    mustIncludeFacts: ["BrightPath Talent", "Senior Engineer"],
  },
  {
    id: "partnership-proposal",
    description: "Partnership proposal semantic query",
    query: "partnership proposal",
    expectedCitationIds: ["partner-helio-01", "partner-summit-02"],
    mustIncludeFacts: ["Helio Partners", "15%"],
  },
  {
    id: "weak-match-nonsense",
    description: "Hard-negative / weak semantic match should flag lowConfidence",
    query: "quantum underwater basket weaving certification flamingo",
    expectLowConfidence: true,
    // No required citation ids; any best-effort set is fine
    expectedCitationIds: [],
    mustIncludeFacts: [],
  },
];
