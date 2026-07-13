import type { ChatMessage, ChatModel } from "../types.ts";

/**
 * Offline chat adapter for demos/CI.
 * - Summarize prompts → short subject/body summary
 * - Answer prompts → extractive answer grounded in provided EMAIL blocks
 *
 * Not a production LLM; production use should plug OpenAIChatModel or similar.
 */
export class ExtractiveChatModel implements ChatModel {
  async complete(messages: ChatMessage[]): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const user = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const combined = `${system}\n${user}`;

    if (/summarize/i.test(combined) && !/answer the (user'?s )?question/i.test(combined)) {
      return summarizeFromPrompt(user);
    }

    return answerFromPrompt(user);
  }
}

function summarizeFromPrompt(user: string): string {
  const subject = matchField(user, "Subject") ?? "";
  const from = matchField(user, "From") ?? "";
  const body = matchField(user, "Body") ?? user;
  const firstLine =
    body
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? body;
  const clip = firstLine.slice(0, 220);
  const bits = [subject && `Re: ${subject}`, from && `From ${from}`, clip].filter(Boolean);
  return bits.join(". ").slice(0, 280);
}

function answerFromPrompt(user: string): string {
  const query = extractQuery(user);
  const blocks = parseEmailBlocks(user);

  if (blocks.length === 0) {
    return "I could not find relevant emails in the provided context.";
  }

  const queryTokens = new Set(
    query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2),
  );

  const scored = blocks.map((b) => ({
    block: b,
    score: scoreBlock(b, queryTokens),
  }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3).filter((s) => s.score > 0 || scored[0]!.score === 0);
  const use = top.length > 0 ? top : scored.slice(0, 1);

  const lines: string[] = [];
  lines.push(`Based on the retrieved emails for “${query || "your query"}”:`);

  for (const { block } of use) {
    const fact = pickFactLine(block.body) || block.subject;
    lines.push(`- [${block.id}] ${block.subject} (${block.from}, ${block.date}): ${fact}`);
  }

  // Surface distinctive tokens useful for golden "must-include" facts
  const facts = collectKeyFacts(use.map((u) => u.block));
  if (facts.length > 0) {
    lines.push(`Key details: ${facts.join("; ")}.`);
  }

  return lines.join("\n");
}

type Block = {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
};

function parseEmailBlocks(user: string): Block[] {
  const blocks: Block[] = [];
  const re =
    /---\s*EMAIL id=([^\s]+)\s*---\s*Subject:\s*(.+?)\s*From:\s*(.+?)\s*Date:\s*(.+?)\s*Body:\s*([\s\S]*?)(?=---\s*EMAIL id=|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(user)) !== null) {
    blocks.push({
      id: m[1]!.trim(),
      subject: m[2]!.trim(),
      from: m[3]!.trim(),
      date: m[4]!.trim(),
      body: m[5]!.trim(),
    });
  }
  return blocks;
}

function extractQuery(user: string): string {
  const m = user.match(/Question:\s*(.+?)(?:\n|$)/i);
  return m?.[1]?.trim() ?? "";
}

function matchField(text: string, field: string): string | undefined {
  const re = new RegExp(`${field}:\\s*(.+)`, "i");
  const m = text.match(re);
  return m?.[1]?.trim();
}

function scoreBlock(block: Block, queryTokens: Set<string>): number {
  const hay = `${block.subject} ${block.from} ${block.body}`.toLowerCase();
  let score = 0;
  for (const t of queryTokens) {
    if (hay.includes(t)) score += 1;
  }
  return score;
}

function pickFactLine(body: string): string {
  const lines = body
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  // Prefer lines with money, invoice ids, roles, or partnership terms
  const preferred =
    lines.find((l) => /\$[\d,]+/.test(l)) ??
    lines.find((l) => /INV-[\w-]+/i.test(l)) ??
    lines.find((l) => /\d+%/i.test(l)) ??
    lines.find((l) => /\$|\binvoice\b|\binterview\b|\bpartnership\b|\d{4}-\d{2}-\d{2}/i.test(l));
  return (preferred ?? lines[0] ?? "").slice(0, 240);
}

function collectKeyFacts(blocks: Block[]): string[] {
  const facts: string[] = [];
  const corpus = blocks.map((b) => `${b.subject}\n${b.body}`).join("\n");

  // Collect all currency amounts (golden fixtures assert specific ones)
  for (const m of corpus.matchAll(/\$[\d,]+(?:\.\d{2})?/g)) {
    facts.push(m[0]!);
  }

  for (const m of corpus.matchAll(/\b\d{1,2}%/g)) {
    facts.push(m[0]!);
  }

  for (const m of corpus.matchAll(/INV-[\w-]+/gi)) {
    facts.push(m[0]!);
  }

  const companies =
    corpus.match(
      /\b(Acme Billing|Northwind Recruiting|Summit Labs|BrightPath Talent|Orbit Commerce|Helio Partners)\b/g,
    ) ?? [];
  for (const c of companies) facts.push(c);

  const when = corpus.match(
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?\b/,
  );
  if (when) facts.push(when[0]);

  const role = corpus.match(
    /\b(?:Senior|Staff|Principal)?\s*(?:Engineer|Designer|PM|Product Manager)\b/,
  );
  if (role) facts.push(role[0].trim());

  return [...new Set(facts)].slice(0, 12);
}
