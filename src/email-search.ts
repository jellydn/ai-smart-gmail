import { buildEmbedText, normalizeEmails } from "./normalize.ts";
import { cosineSimilarity } from "./similarity.ts";
import type {
  Citation,
  Email,
  EmailSearchConfig,
  IndexedEmail,
  SearchFilters,
  SearchOptions,
  SearchResult,
} from "./types.ts";
import { DEFAULT_LOW_CONFIDENCE_THRESHOLD, DEFAULT_TOP_K } from "./types.ts";

export class EmptyCorpusError extends Error {
  constructor(message = "Cannot search: corpus is empty. Call index() with at least one email.") {
    super(message);
    this.name = "EmptyCorpusError";
  }
}

/**
 * In-memory hybrid RAG email search:
 * ingest → summarize if needed → embed summary(+subject) →
 * filter → top-k → expand full bodies → generate answer → lowConfidence.
 */
export class EmailSearch {
  private readonly embedder: EmailSearchConfig["embedder"];
  private readonly chat: EmailSearchConfig["chat"];
  private readonly defaultTopK: number;
  private readonly defaultLowConfidenceThreshold: number;
  private records: IndexedEmail[] = [];

  constructor(config: EmailSearchConfig) {
    if (!config?.embedder || !config?.chat) {
      throw new Error("EmailSearch requires embedder and chat providers");
    }
    this.embedder = config.embedder;
    this.chat = config.chat;
    this.defaultTopK = config.defaultTopK ?? DEFAULT_TOP_K;
    this.defaultLowConfidenceThreshold =
      config.defaultLowConfidenceThreshold ?? DEFAULT_LOW_CONFIDENCE_THRESHOLD;
  }

  /** Number of emails currently indexed. */
  get size(): number {
    return this.records.length;
  }

  /** Snapshot of indexed records (for tests / debugging). */
  getIndexed(): readonly IndexedEmail[] {
    return this.records;
  }

  /**
   * Build (or replace) the searchable index from emails.
   * Missing summaries are generated via the chat model.
   */
  async index(emails: Email[]): Promise<void> {
    const normalized = normalizeEmails(emails);
    const withSummaries: Array<Email & { summary: string }> = [];

    for (const email of normalized) {
      let summary = email.summary;
      if (!summary) {
        summary = await this.generateSummary(email);
      }
      withSummaries.push({ ...email, summary });
    }

    const embedTexts = withSummaries.map((e) => buildEmbedText(e.summary, e.subject));
    const embeddings = embedTexts.length === 0 ? [] : await this.embedder.embed(embedTexts);

    if (embeddings.length !== withSummaries.length) {
      throw new Error(
        `Embedder returned ${embeddings.length} vectors for ${withSummaries.length} emails`,
      );
    }

    this.records = withSummaries.map((email, i) => ({
      email,
      summary: email.summary,
      embedText: embedTexts[i]!,
      embedding: embeddings[i]!,
    }));
  }

  /**
   * Search the index. Returns answer + citations + lowConfidence.
   * @throws EmptyCorpusError when no emails are indexed
   */
  async search(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions,
  ): Promise<SearchResult> {
    if (this.records.length === 0) {
      throw new EmptyCorpusError();
    }

    const q = typeof query === "string" ? query.trim() : "";
    if (!q) {
      throw new Error("query must be a non-empty string");
    }

    const topK = options?.topK ?? this.defaultTopK;
    const threshold = options?.lowConfidenceThreshold ?? this.defaultLowConfidenceThreshold;

    const candidates = this.records.filter((r) => passesDateFilter(r.email.date, filters));

    if (candidates.length === 0) {
      return {
        answer: "No emails matched the provided filters, so I cannot answer from the corpus.",
        citations: [],
        lowConfidence: true,
      };
    }

    const [queryEmbedding] = await this.embedder.embed([q]);
    if (!queryEmbedding) {
      throw new Error("Embedder returned no vector for the query");
    }

    const ranked = candidates
      .map((r) => ({
        record: r,
        score: cosineSimilarity(queryEmbedding, r.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const hits = ranked.slice(0, Math.max(1, topK));
    const maxScore = hits[0]?.score ?? 0;
    const lowConfidence = maxScore < threshold;

    const citations: Citation[] = hits.map(({ record, score }) => ({
      emailId: record.email.id,
      score,
      snippet: record.summary.slice(0, 160),
    }));

    // Hybrid: generation receives FULL bodies of top-k, not just summaries
    const answer = await this.generateAnswer(
      q,
      hits.map((h) => h.record),
    );

    return {
      answer,
      citations,
      lowConfidence,
    };
  }

  private async generateSummary(email: Email): Promise<string> {
    const text = await this.chat.complete([
      {
        role: "system",
        content:
          "Summarize the email in 1-2 sentences for search indexing. Include topic, parties, and key facts.",
      },
      {
        role: "user",
        content: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date.toISOString()}\nBody:\n${email.body}`,
      },
    ]);
    const summary = text.trim();
    if (!summary) {
      return `${email.subject} from ${email.from}`.slice(0, 280);
    }
    return summary.slice(0, 500);
  }

  private async generateAnswer(query: string, hits: IndexedEmail[]): Promise<string> {
    const blocks = hits
      .map((h) => {
        const e = h.email;
        return [
          `--- EMAIL id=${e.id} ---`,
          `Subject: ${e.subject}`,
          `From: ${e.from}`,
          `Date: ${e.date.toISOString()}`,
          `Body:`,
          e.body,
        ].join("\n");
      })
      .join("\n\n");

    const answer = await this.chat.complete([
      {
        role: "system",
        content:
          "Answer the user's question using ONLY the email bodies provided. " +
          "Ground every claim in those emails. Mention email ids in brackets when citing. " +
          "If evidence is weak, still give a best-effort answer from the closest emails.",
      },
      {
        role: "user",
        content: `Question: ${query}\n\nRetrieved emails (full bodies):\n\n${blocks}`,
      },
    ]);

    const trimmed = answer.trim();
    if (!trimmed) {
      return "I found related emails but could not produce an answer.";
    }
    return trimmed;
  }
}

function passesDateFilter(date: Date, filters?: SearchFilters): boolean {
  if (!filters) return true;
  const t = date.getTime();
  if (filters.dateFrom !== undefined) {
    const from = filters.dateFrom.getTime();
    if (t < from) return false;
  }
  if (filters.dateTo !== undefined) {
    const to = filters.dateTo.getTime();
    if (t > to) return false;
  }
  return true;
}
