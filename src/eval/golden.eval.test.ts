import { describe, expect, test } from "bun:test";
import { ExtractiveChatModel } from "../adapters/extractive-chat.ts";
import { LexicalEmbedder } from "../adapters/lexical-embedder.ts";
import { EmailSearch } from "../email-search.ts";
import { loadSyntheticEmails } from "../fixtures/emails.ts";
import { GOLDEN_CASES } from "../fixtures/golden.ts";

/**
 * Golden eval harness — runs without live API keys or Gmail.
 * Uses LexicalEmbedder + ExtractiveChatModel (fixed/offline model path).
 */
describe("golden eval (fixtures + offline models)", () => {
  const search = new EmailSearch({
    embedder: new LexicalEmbedder(),
    chat: new ExtractiveChatModel(),
    // Align with lexical score ranges for clear weak-match separation
    defaultLowConfidenceThreshold: 0.18,
  });

  // Index once for the suite
  let ready: Promise<void>;
  const ensureIndex = () => {
    if (!ready) {
      ready = search.index(loadSyntheticEmails());
    }
    return ready;
  };

  test("synthetic corpus size is between 20 and 50", async () => {
    await ensureIndex();
    const n = loadSyntheticEmails().length;
    expect(n).toBeGreaterThanOrEqual(20);
    expect(n).toBeLessThanOrEqual(50);
    expect(search.size).toBe(n);
  });

  for (const gc of GOLDEN_CASES) {
    test(`golden: ${gc.id} — ${gc.description}`, async () => {
      await ensureIndex();
      const result = await search.search(gc.query, gc.filters);

      expect(typeof result.answer).toBe("string");
      expect(Array.isArray(result.citations)).toBe(true);
      expect(typeof result.lowConfidence).toBe("boolean");

      if (gc.expectLowConfidence) {
        expect(result.lowConfidence).toBe(true);
        // Best-effort: still return an answer when possible
        expect(result.answer.length).toBeGreaterThan(0);
        return;
      }

      const cited = new Set(result.citations.map((c) => c.emailId));
      const hit = gc.expectedCitationIds.some((id) => cited.has(id));
      expect(hit).toBe(true);

      if (gc.forbiddenCitationIds?.length) {
        for (const bad of gc.forbiddenCitationIds) {
          expect(cited.has(bad)).toBe(false);
        }
      }

      const answerLower = result.answer.toLowerCase();
      for (const fact of gc.mustIncludeFacts) {
        expect(answerLower).toContain(fact.toLowerCase());
      }
    });
  }
});
