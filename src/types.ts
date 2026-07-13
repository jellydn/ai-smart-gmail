/**
 * Public types for the semantic email search library.
 */

/** A single email message in the corpus. */
export type Email = {
  id: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
  /** Optional precomputed summary. If missing at index time, generated via ChatModel. */
  summary?: string;
};

/** Structured metadata filters applied before/during retrieval. */
export type SearchFilters = {
  dateFrom?: Date;
  dateTo?: Date;
};

export type Citation = {
  emailId: string;
  score: number;
  snippet?: string;
};

export type SearchResult = {
  answer: string;
  citations: Citation[];
  lowConfidence: boolean;
};

export type SearchOptions = {
  /** Number of top hits to expand into full bodies for generation. Default: 5. */
  topK?: number;
  /**
   * Max cosine similarity below which results are flagged lowConfidence.
   * Default: {@link DEFAULT_LOW_CONFIDENCE_THRESHOLD}.
   */
  lowConfidenceThreshold?: number;
};

/** Default top-k for hybrid expansion (documented default). */
export const DEFAULT_TOP_K = 5;

/**
 * Default absolute cosine-similarity threshold for lowConfidence.
 * Tunable via SearchOptions / EmailSearchConfig; re-tune with the golden eval.
 */
/** Absolute cosine floor; weak/random queries on LexicalEmbedder typically score ~0.15 or below. */
export const DEFAULT_LOW_CONFIDENCE_THRESHOLD = 0.18;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Pluggable embedding provider. */
export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

/** Pluggable chat / completion provider. */
export interface ChatModel {
  complete(messages: ChatMessage[]): Promise<string>;
}

export type EmailSearchConfig = {
  embedder: Embedder;
  chat: ChatModel;
  /** Default topK when search options omit it. */
  defaultTopK?: number;
  /** Default low-confidence threshold when search options omit it. */
  defaultLowConfidenceThreshold?: number;
};

/** Internal indexed record (not part of stable public surface, but exported for tests). */
export type IndexedEmail = {
  email: Email;
  summary: string;
  /** Text that was embedded (summary + subject). */
  embedText: string;
  embedding: number[];
};
