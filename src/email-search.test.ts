import { describe, expect, test } from "bun:test";
import { ExtractiveChatModel } from "./adapters/extractive-chat.ts";
import { LexicalEmbedder } from "./adapters/lexical-embedder.ts";
import { EmailSearch, EmptyCorpusError } from "./email-search.ts";
import { EmailValidationError } from "./normalize.ts";
import type { ChatMessage, ChatModel, Embedder, Email } from "./types.ts";
import { DEFAULT_TOP_K } from "./types.ts";

/** Recording embedder: tracks every text passed to embed(). */
class RecordingEmbedder implements Embedder {
  readonly calls: string[][] = [];
  private readonly inner = new LexicalEmbedder();

  async embed(texts: string[]): Promise<number[][]> {
    this.calls.push([...texts]);
    return this.inner.embed(texts);
  }
}

/** Recording chat: tracks prompts and optionally forces low-value answers. */
class RecordingChat implements ChatModel {
  readonly prompts: ChatMessage[][] = [];
  private readonly inner = new ExtractiveChatModel();

  async complete(messages: ChatMessage[]): Promise<string> {
    this.prompts.push(messages.map((m) => ({ ...m })));
    return this.inner.complete(messages);
  }
}

const sampleEmails: Email[] = [
  {
    id: "e1",
    subject: "Invoice from VendorCo",
    from: "ap@vendorco.example",
    date: new Date("2026-06-10T12:00:00Z"),
    body: "Invoice INV-1 amount $500.00 from VendorCo for June consulting.",
    summary: "Invoice INV-1 $500 from VendorCo for June consulting.",
  },
  {
    id: "e2",
    subject: "Interview invitation — Staff Designer",
    from: "jobs@hire.example",
    date: new Date("2026-07-01T12:00:00Z"),
    body: "Interview invitation for Staff Designer on July 15 with HireCo.",
    summary: "Interview invitation for Staff Designer role at HireCo on July 15.",
  },
  {
    id: "e3",
    subject: "Old May invoice",
    from: "ap@vendorco.example",
    date: new Date("2026-05-03T12:00:00Z"),
    body: "May invoice INV-MAY $12.00 — should be filtered out of June window.",
    summary: "May invoice INV-MAY for $12.00.",
  },
];

describe("EmailSearch library", () => {
  test("rejects invalid emails with clear errors", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });
    await expect(
      search.index([{ id: "", subject: "x", from: "a", date: new Date(), body: "b" } as Email]),
    ).rejects.toBeInstanceOf(EmailValidationError);
  });

  test("empty corpus search throws EmptyCorpusError", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });
    await expect(search.search("invoice")).rejects.toBeInstanceOf(EmptyCorpusError);
  });

  test("search result shape: answer, citations with emailId+score, lowConfidence boolean", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });
    await search.index(sampleEmails);
    const result = await search.search("invoice");

    expect(typeof result.answer).toBe("string");
    expect(result.answer.length).toBeGreaterThan(0);
    expect(Array.isArray(result.citations)).toBe(true);
    expect(result.citations.length).toBeGreaterThan(0);
    for (const c of result.citations) {
      expect(typeof c.emailId).toBe("string");
      expect(typeof c.score).toBe("number");
    }
    expect(typeof result.lowConfidence).toBe("boolean");
  });

  test("date filters exclude out-of-window email ids from citations", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });
    await search.index(sampleEmails);
    const result = await search.search("invoice", {
      dateFrom: new Date("2026-06-01T00:00:00Z"),
      dateTo: new Date("2026-06-30T23:59:59Z"),
    });

    const ids = result.citations.map((c) => c.emailId);
    expect(ids).toContain("e1");
    expect(ids).not.toContain("e3");
    expect(ids).not.toContain("e2");
  });

  test("missing summary invokes chat and indexes successfully", async () => {
    const chat = new RecordingChat();
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat,
    });
    const withoutSummary: Email = {
      id: "nosum",
      subject: "Partnership proposal from Helio",
      from: "bd@helio.example",
      date: new Date("2026-07-05T00:00:00Z"),
      body: "We propose a partnership with 10% revenue share.",
    };
    await search.index([withoutSummary]);
    expect(search.size).toBe(1);

    const summarizeCalls = chat.prompts.filter((msgs) =>
      msgs.some((m) => /summarize/i.test(m.content)),
    );
    expect(summarizeCalls.length).toBeGreaterThanOrEqual(1);

    const indexed = search.getIndexed()[0]!;
    expect(indexed.summary.length).toBeGreaterThan(0);
    expect(indexed.email.summary ?? indexed.summary).toBeTruthy();
  });

  test("hybrid: embedder sees summary-side text; generation prompt includes full body", async () => {
    const embedder = new RecordingEmbedder();
    const chat = new RecordingChat();
    const search = new EmailSearch({ embedder, chat });

    const bodyMarker = "UNIQUE_BODY_MARKER_XYZ_98765 for full body expansion test";
    const summaryText = "Short summary about invoices only";
    await search.index([
      {
        id: "hybrid-1",
        subject: "Invoice notice",
        from: "a@b.example",
        date: new Date("2026-06-12T00:00:00Z"),
        body: `Header line.\n${bodyMarker}\nFooter.`,
        summary: summaryText,
      },
    ]);

    // Index-time embeddings should include summary/subject, not rely on unique body marker alone
    const indexEmbedBatch = embedder.calls[0] ?? [];
    expect(indexEmbedBatch.some((t) => t.includes(summaryText))).toBe(true);
    expect(indexEmbedBatch.some((t) => t.includes("Subject:"))).toBe(true);

    await search.search("invoice");

    const answerPrompts = chat.prompts.filter((msgs) =>
      msgs.some((m) => /answer the user/i.test(m.content) || /Question:/i.test(m.content)),
    );
    expect(answerPrompts.length).toBeGreaterThanOrEqual(1);
    const answerBlob = answerPrompts.map((p) => p.map((m) => m.content).join("\n")).join("\n");
    expect(answerBlob).toContain(bodyMarker);
    expect(answerBlob).toContain("Retrieved emails (full bodies)");
  });

  test("weak scores set lowConfidence true without dropping answer", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
      defaultLowConfidenceThreshold: 0.99, // force low confidence
    });
    await search.index(sampleEmails);
    const result = await search.search("invoice");
    expect(result.lowConfidence).toBe(true);
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.citations.length).toBeGreaterThan(0);
  });

  test("topK is configurable and defaults to DEFAULT_TOP_K", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });
    const many: Email[] = Array.from({ length: 8 }, (_, i) => ({
      id: `m${i}`,
      subject: `Invoice number ${i}`,
      from: "b@example.com",
      date: new Date("2026-06-01T00:00:00Z"),
      body: `Invoice body ${i} amount $${i}.00`,
      summary: `Invoice ${i}`,
    }));
    await search.index(many);
    const def = await search.search("invoice");
    expect(def.citations.length).toBeLessThanOrEqual(DEFAULT_TOP_K);

    const limited = await search.search("invoice", undefined, { topK: 2 });
    expect(limited.citations.length).toBe(2);
  });

  test("queries without filters search the full corpus", async () => {
    const search = new EmailSearch({
      embedder: new LexicalEmbedder(),
      chat: new ExtractiveChatModel(),
    });
    await search.index(sampleEmails);
    const result = await search.search("interview invitation");
    const ids = result.citations.map((c) => c.emailId);
    expect(ids).toContain("e2");
  });

  test("core does not import openai vendor outside adapters (structural)", async () => {
    const core = await Bun.file(new URL("./email-search.ts", import.meta.url)).text();
    expect(core.includes("openai.com")).toBe(false);
    expect(core.includes("OpenAI")).toBe(false);
  });
});
