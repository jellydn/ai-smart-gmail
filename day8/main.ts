// day8/main.ts
// Day 8 build: embed a small set of notes, then search them by MEANING.
// Run with:  bun run day8/main.ts   (from repo root)  or  cd day8 && bun start

import { cosineSimilarity } from "./cosine.ts";
import { SemanticEmbedder } from "./embedder.ts";
import { notes } from "./notes.ts";

// Queries deliberately use DIFFERENT words than the notes to prove we are
// matching on meaning, not keyword overlap.
const queries = [
  "What documents do I need before going to another country?", // -> passport (n1)
  "How can I feel less anxious and calm down?", // -> mindfulness (n8)
  "Money that clients still owe us", // -> invoice (n7)
  "Ways to sleep better at night", // -> diet + exercise (n10)
  "Why does my back hurt when I sit all day?", // -> stretching (n6)
];

async function main() {
  console.log("Loading local embedding model (first run downloads ~25MB)…");
  const embedder = new SemanticEmbedder();

  console.log(`Embedding ${notes.length} notes…`);
  const noteVectors = await embedder.embed(notes.map((n) => n.text));

  for (const query of queries) {
    const [queryVec] = await embedder.embed([query]);

    const ranked = notes
      .map((note, i) => ({
        id: note.id,
        text: note.text,
        score: cosineSimilarity(queryVec, noteVectors[i]!),
      }))
      .sort((a, b) => b.score - a.score);

    console.log(`\n🔎  ${query}`);
    for (const r of ranked.slice(0, 3)) {
      console.log(`   ${r.score.toFixed(3)}  [${r.id}]  ${r.text}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
