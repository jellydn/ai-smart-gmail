import type { ChatMessage, ChatModel, Embedder } from "../types.ts";

export type OpenAIAdapterOptions = {
  apiKey?: string;
  baseUrl?: string;
  embedModel?: string;
  chatModel?: string;
  /**
   * Optional fetch implementation (for tests). Defaults to global fetch.
   */
  fetchImpl?: typeof fetch;
};

/**
 * Default **cloud** adapters for OpenAI-compatible APIs.
 *
 * Privacy: email text (summaries, bodies, queries) is sent to the configured
 * endpoint. Prefer LexicalEmbedder + ExtractiveChatModel for local/offline use.
 *
 * Requires OPENAI_API_KEY (or options.apiKey).
 */
export class OpenAIEmbedder implements Embedder {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAIAdapterOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = (
      options.baseUrl ??
      process.env.OPENAI_BASE_URL ??
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    this.model = options.embedModel ?? process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAIEmbedder: missing API key. Set OPENAI_API_KEY or pass apiKey. " +
          "For offline use, inject LexicalEmbedder instead.",
      );
    }
    const res = await this.fetchImpl(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI embeddings failed (${res.status}): ${body}`);
    }
    const json = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}

export class OpenAIChatModel implements ChatModel {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAIAdapterOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = (
      options.baseUrl ??
      process.env.OPENAI_BASE_URL ??
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    this.model = options.chatModel ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAIChatModel: missing API key. Set OPENAI_API_KEY or pass apiKey. " +
          "For offline use, inject ExtractiveChatModel instead.",
      );
    }
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI chat failed (${res.status}): ${body}`);
    }
    const json = (await res.json()) as {
      choices: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI chat returned empty content");
    }
    return content;
  }
}

/** Convenience factory for the documented default cloud pair. */
export function createOpenAIProviders(options: OpenAIAdapterOptions = {}): {
  embedder: Embedder;
  chat: ChatModel;
} {
  return {
    embedder: new OpenAIEmbedder(options),
    chat: new OpenAIChatModel(options),
  };
}
