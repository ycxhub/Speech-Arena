export const SENTENCE_LABEL_OPTIONS = [
  "Social Media",
  "Narration",
  "Story Telling",
  "Outbound Calls",
  "Personal Assistants",
  "Customer Service",
  "News",
  "Others",
] as const;

export type SentenceLabel = (typeof SENTENCE_LABEL_OPTIONS)[number];

export const VALID_SENTENCE_LABELS = new Set(
  SENTENCE_LABEL_OPTIONS.map((l) => l.toLowerCase())
);

export function isValidSentenceLabel(value: string): boolean {
  return VALID_SENTENCE_LABELS.has(value.trim().toLowerCase());
}

export function normalizeSentenceLabel(value: string): SentenceLabel | null {
  const trimmed = value.trim();
  const found = SENTENCE_LABEL_OPTIONS.find(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase()
  );
  return found ?? null;
}
