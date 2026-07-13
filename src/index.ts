/**
 * ai-smart-gmail — semantic email search library (hybrid RAG).
 *
 * Privacy note: the default cloud OpenAI adapters send email text to a remote API.
 * For offline/local use, inject LexicalEmbedder + ExtractiveChatModel (or your own providers).
 */

export type {
  ChatMessage,
  ChatModel,
  Citation,
  Email,
  EmailSearchConfig,
  Embedder,
  IndexedEmail,
  SearchFilters,
  SearchOptions,
  SearchResult,
} from "./types.ts";

export { DEFAULT_LOW_CONFIDENCE_THRESHOLD, DEFAULT_TOP_K } from "./types.ts";

export { EmailSearch, EmptyCorpusError } from "./email-search.ts";
export {
  EmailValidationError,
  normalizeEmail,
  normalizeEmails,
  buildEmbedText,
} from "./normalize.ts";
export { cosineSimilarity } from "./similarity.ts";

export { LexicalEmbedder } from "./adapters/lexical-embedder.ts";
export { ExtractiveChatModel } from "./adapters/extractive-chat.ts";
export {
  OpenAIChatModel,
  OpenAIEmbedder,
  createOpenAIProviders,
  type OpenAIAdapterOptions,
} from "./adapters/openai.ts";

export { SYNTHETIC_EMAILS, loadSyntheticEmails } from "./fixtures/emails.ts";
export { GOLDEN_CASES, lastMonthRange, type GoldenCase } from "./fixtures/golden.ts";
