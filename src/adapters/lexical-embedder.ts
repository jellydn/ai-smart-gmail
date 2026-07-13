import type { Embedder } from "../types.ts";

/**
 * Offline deterministic embedder: hashed bag-of-words with L2-normalized vectors.
 * Good enough for synthetic fixtures and CI without API keys.
 * Not a substitute for production embedding models.
 */
export class LexicalEmbedder implements Embedder {
  readonly dimensions: number;

  constructor(dimensions = 256) {
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }

  private embedOne(text: string): number[] {
    const vec = new Array<number>(this.dimensions).fill(0);
    const tokens = tokenize(text);
    if (tokens.length === 0) return vec;

    for (const token of tokens) {
      const h = hashToken(token);
      const idx = h % this.dimensions;
      const sign = h % 2 === 0 ? 1 : -1;
      vec[idx]! += sign;
      // Adjacent bin for slight locality on shared prefixes
      const idx2 = (h >>> 8) % this.dimensions;
      vec[idx2]! += sign * 0.5;
    }

    // Boost exact multi-word phrases for domain keywords
    const lower = text.toLowerCase();
    for (const phrase of DOMAIN_PHRASES) {
      if (lower.includes(phrase)) {
        const h = hashToken(phrase.replace(/\s+/g, "_"));
        const idx = h % this.dimensions;
        vec[idx]! += 3;
      }
    }

    return l2Normalize(vec);
  }
}

const DOMAIN_PHRASES = [
  "invoice",
  "interview",
  "partnership",
  "proposal",
  "invitation",
  "billing",
  "payment",
  "candidate",
  "collaboration",
  "newsletter",
  "receipt",
  "shipping",
  "meeting",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9@$._\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function l2Normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  if (sum === 0) return vec;
  const n = Math.sqrt(sum);
  return vec.map((v) => v / n);
}
