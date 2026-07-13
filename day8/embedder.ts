// day8/embedder.ts
// A REAL semantic embedder: turns text into a vector using a Sentence-Transformers
// model (all-MiniLM-L6-v2) running 100% locally via @huggingface/transformers.
// No API key, no network calls after the first model download.
//
// This is the opposite of a "bag-of-words" embedder: it captures MEANING, so
// "I need a travel document" and "renew your passport" land near each other even
// though they share almost no words.

import { env, pipeline } from "@huggingface/transformers";

// We pull the model from the Hugging Face hub cache (downloaded once).
env.allowLocalModels = false;

export class SemanticEmbedder {
  private extractor: Awaited<ReturnType<typeof pipeline>> | null = null;
  private readonly model: string;

  constructor(model = "Xenova/all-MiniLM-L6-v2") {
    this.model = model;
  }

  private async getExtractor() {
    if (!this.extractor) {
      this.extractor = await pipeline("feature-extraction", this.model);
    }
    return this.extractor;
  }

  /** Embed one or many texts into L2-normalized vectors (length 384). */
  async embed(texts: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();
    // pooling: "mean" collapses the token dimension into one vector per text.
    // normalize: true makes every vector unit-length, so cosine == dot product.
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return output.tolist() as number[][];
  }
}
