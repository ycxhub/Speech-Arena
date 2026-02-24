/**
 * Parser for Create on-the-fly task text uploads.
 * Supports .txt (one line per item) and .csv (text column required).
 */

import Papa from "papaparse";

const MAX_LINE_LENGTH = 5000;
const MAX_ITEMS = 1000;

export interface ParsedTextItem {
  text: string;
  item_index: number;
}

export interface TextUploadParseResult {
  valid: boolean;
  items: ParsedTextItem[];
  errors: string[];
}

/**
 * Parse .txt file: one line per item. Trim whitespace, skip empty lines.
 */
function parseTxt(content: string): TextUploadParseResult {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const items: ParsedTextItem[] = [];

  if (lines.length > MAX_ITEMS) {
    errors.push(`Maximum ${MAX_ITEMS} items allowed. Found ${lines.length}.`);
    return { valid: false, items: [], errors };
  }

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]!;
    if (text.length > MAX_LINE_LENGTH) {
      errors.push(`Line ${i + 1}: Text exceeds ${MAX_LINE_LENGTH} characters.`);
      continue;
    }
    items.push({ text, item_index: i + 1 });
  }

  if (items.length === 0 && lines.length === 0) {
    errors.push("File is empty or contains only empty lines.");
  }

  return {
    valid: errors.length === 0,
    items,
    errors,
  };
}

/**
 * Parse .csv file: requires "text" column; optional "item_id".
 * Row order = item index. Skip rows with empty text.
 */
function parseCsv(content: string): TextUploadParseResult {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const errors: string[] = [];

  if (!headers.includes("text")) {
    errors.push('CSV must have a "text" column.');
    return { valid: false, items: [], errors };
  }

  const items: ParsedTextItem[] = [];
  let itemIndex = 1;

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const text = raw?.text?.trim();
    if (!text) continue;

    if (text.length > MAX_LINE_LENGTH) {
      errors.push(`Row ${i + 2}: Text exceeds ${MAX_LINE_LENGTH} characters.`);
      continue;
    }

    items.push({ text, item_index: itemIndex });
    itemIndex++;
  }

  if (items.length > MAX_ITEMS) {
    errors.push(`Maximum ${MAX_ITEMS} items allowed. Found ${items.length}.`);
    return { valid: false, items: [], errors };
  }

  if (items.length === 0) {
    errors.push("No valid rows with non-empty text found.");
  }

  return {
    valid: errors.length === 0,
    items,
    errors,
  };
}

/**
 * Parse text upload for Create on-the-fly. Accepts .txt or .csv content.
 * Detects format by checking for CSV header (comma-separated, has "text" column).
 */
export function parseTextUpload(
  content: string,
  filename: string
): TextUploadParseResult {
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (ext === "csv") {
    return parseCsv(content);
  }

  if (ext === "txt" || ext === "text") {
    return parseTxt(content);
  }

  // Try to detect: if first line looks like CSV headers (contains "text")
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  if (firstLine.toLowerCase().includes("text") && firstLine.includes(",")) {
    return parseCsv(content);
  }

  return parseTxt(content);
}
