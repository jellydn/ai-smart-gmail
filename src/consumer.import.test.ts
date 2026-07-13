import { describe, expect, test } from "bun:test";

/**
 * Fresh consumer path: import the public package entry (src/index.ts via package exports)
 * rather than internal modules only.
 */
describe("public library consumer import", () => {
  test("index tiny fixture set via public API and search once", async () => {
    const lib = await import("./index.ts");
    const { EmailSearch, LexicalEmbedder, ExtractiveChatModel } = lib;

    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });

    await search.index([
      {
        id: "c1",
        subject: "Partnership proposal",
        from: "bd@helio.example",
        date: new Date("2026-07-01T00:00:00Z"),
        body: "Helio Partners partnership proposal with 12% share.",
        summary: "Helio Partners partnership proposal 12% share.",
      },
      {
        id: "c2",
        subject: "Lunch plans",
        from: "friend@example.com",
        date: new Date("2026-07-02T00:00:00Z"),
        body: "Want tacos?",
        summary: "Personal lunch plans.",
      },
    ]);

    const result = await search.search("partnership proposal");

    expect(typeof result.answer).toBe("string");
    expect(result.answer.length).toBeGreaterThan(0);
    expect(typeof result.lowConfidence).toBe("boolean");

    const indexedIds = new Set(["c1", "c2"]);
    for (const c of result.citations) {
      expect(indexedIds.has(c.emailId)).toBe(true);
      expect(typeof c.score).toBe("number");
    }
    expect(result.citations.some((c) => c.emailId === "c1")).toBe(true);
  });

  test("exports cloud adapter symbols for documentation path", async () => {
    const lib = await import("./index.ts");
    expect(typeof lib.createOpenAIProviders).toBe("function");
    expect(typeof lib.OpenAIEmbedder).toBe("function");
    expect(typeof lib.OpenAIChatModel).toBe("function");
    expect(typeof lib.DEFAULT_TOP_K).toBe("number");
    expect(typeof lib.DEFAULT_LOW_CONFIDENCE_THRESHOLD).toBe("number");
  });
});
