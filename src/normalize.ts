import type { Email } from "./types.ts";

export class EmailValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailValidationError";
  }
}

function requireNonEmptyString(value: unknown, field: string, idHint?: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    const where = idHint ? ` (email id hint: ${idHint})` : "";
    throw new EmailValidationError(`Email.${field} must be a non-empty string${where}`);
  }
  return value.trim();
}

/**
 * Normalize and validate an email. Coerces date strings to Date.
 * Does not generate summaries.
 */
export function normalizeEmail(input: Email): Email {
  const id = requireNonEmptyString(input?.id, "id");
  const subject = requireNonEmptyString(input?.subject, "subject", id);
  const from = requireNonEmptyString(input?.from, "from", id);
  const body = requireNonEmptyString(input?.body, "body", id);

  let date: Date;
  if (input.date instanceof Date) {
    if (Number.isNaN(input.date.getTime())) {
      throw new EmailValidationError(`Email.date is invalid for id=${id}`);
    }
    date = input.date;
  } else if (typeof input.date === "string" || typeof input.date === "number") {
    date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw new EmailValidationError(`Email.date could not be parsed for id=${id}`);
    }
  } else {
    throw new EmailValidationError(`Email.date is required for id=${id}`);
  }

  const summary =
    typeof input.summary === "string" && input.summary.trim().length > 0
      ? input.summary.trim()
      : undefined;

  return { id, subject, from, date, body, summary };
}

export function normalizeEmails(inputs: Email[]): Email[] {
  if (!Array.isArray(inputs)) {
    throw new EmailValidationError("emails must be an array");
  }
  const seen = new Set<string>();
  const out: Email[] = [];
  for (const raw of inputs) {
    const email = normalizeEmail(raw);
    if (seen.has(email.id)) {
      throw new EmailValidationError(`Duplicate email id: ${email.id}`);
    }
    seen.add(email.id);
    out.push(email);
  }
  return out;
}

/** Text used for embedding: summary (+ subject for topical signal). */
export function buildEmbedText(summary: string, subject: string): string {
  return `Subject: ${subject}\nSummary: ${summary}`;
}
