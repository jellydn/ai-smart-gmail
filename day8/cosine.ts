// day8/cosine.ts
// The heart of vector search: cosine similarity between two embedding vectors.
// Because our embedder returns unit-length vectors, this equals the dot product,
// but writing it generally makes the math explicit and correct for any vectors.

/**
 * Cosine similarity in [-1, 1].
 * 1 = same direction (very similar meaning),
 * 0 = unrelated,
 * -1 = opposite.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    magA += x * x;
    magB += y * y;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
