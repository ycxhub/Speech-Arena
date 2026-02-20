import Papa from "papaparse";

export interface ParsedRow {
  item_id: string;
  text: string;
  audio_filename: string;
  ipa?: string;
  normalized_text?: string;
  [key: string]: string | undefined;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ParseResult {
  valid: boolean;
  rows: ParsedRow[];
  errors: ValidationError[];
  headers: string[];
}

const REQUIRED_COLUMNS = ["item_id", "text", "audio_filename"];

export function parseAndValidateCsv(
  csvContent: string,
  audioFileNames: string[]
): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const errors: ValidationError[] = [];

  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push({
        row: 0,
        column: col,
        message: `Required column "${col}" is missing from the CSV header`,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, rows: [], errors, headers };
  }

  const audioSet = new Set(audioFileNames.map((n) => n.toLowerCase()));
  const seenIds = new Set<string>();
  const rows: ParsedRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const rowNum = i + 2; // 1-indexed + header row

    const itemId = raw.item_id?.trim();
    const text = raw.text?.trim();
    const audioFilename = raw.audio_filename?.trim();

    if (!itemId) {
      errors.push({ row: rowNum, column: "item_id", message: "item_id is empty" });
    } else if (seenIds.has(itemId)) {
      errors.push({ row: rowNum, column: "item_id", message: `Duplicate item_id "${itemId}"` });
    } else {
      seenIds.add(itemId);
    }

    if (!text) {
      errors.push({ row: rowNum, column: "text", message: "text is empty" });
    }

    if (!audioFilename) {
      errors.push({ row: rowNum, column: "audio_filename", message: "audio_filename is empty" });
    } else if (audioSet.size > 0 && !audioSet.has(audioFilename.toLowerCase())) {
      errors.push({
        row: rowNum,
        column: "audio_filename",
        message: `Audio file "${audioFilename}" not found in uploaded files`,
      });
    }

    rows.push({
      item_id: itemId || "",
      text: text || "",
      audio_filename: audioFilename || "",
      ipa: raw.ipa?.trim() || undefined,
      normalized_text: raw.normalized_text?.trim() || undefined,
      ...Object.fromEntries(
        Object.entries(raw)
          .filter(([k]) => !REQUIRED_COLUMNS.includes(k) && k !== "ipa" && k !== "normalized_text")
          .map(([k, v]) => [k, v?.trim()])
      ),
    });
  }

  return {
    valid: errors.length === 0,
    rows,
    errors,
    headers,
  };
}
