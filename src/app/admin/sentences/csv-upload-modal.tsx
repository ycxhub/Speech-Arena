"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { bulkImportSentences } from "./actions";
import { toast } from "sonner";

type Language = { id: string; code: string; name: string };

interface CsvUploadModalProps {
  open: boolean;
  onClose: () => void;
  languages: Language[];
  onSuccess?: () => void;
}

type ParsedRow = {
  language_code: string;
  text: string;
  index: number;
  error?: string;
  isDuplicate?: boolean;
};

export function CsvUploadModal({
  open,
  onClose,
  languages,
  onSuccess: _onSuccess,
}: CsvUploadModalProps) {
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const validateRows = useCallback(
    (rows: { language_code: string; text: string }[]): ParsedRow[] => {
      const codeSet = new Set(languages.map((l) => l.code.toLowerCase()));
      // Accept "en" when any en-* variant exists (en-IN, en-US, en-UK)
      if (["en-in", "en-us", "en-uk"].some((c) => codeSet.has(c))) {
        codeSet.add("en");
      }
      const seen = new Set<string>();
      return rows.map((r, i) => {
        const code = r.language_code?.trim().toLowerCase();
        const text = r.text?.trim();
        let error: string | undefined;
        let isDuplicate = false;

        if (!code) error = "Missing language_code";
        else if (!codeSet.has(code)) error = `Unknown language "${code}"`;
        if (!text) error = (error ? `${error}; ` : "") + "Missing text";
        else if (text.length > 500)
          error = (error ? `${error}; ` : "") + "Text exceeds 500 chars";

        const key = `${code}:${text}`;
        if (!error && seen.has(key)) {
          isDuplicate = true;
        }
        if (!error) seen.add(key);

        return {
          language_code: code ?? "",
          text: text ?? "",
          index: i + 1,
          error,
          isDuplicate,
        };
      });
    },
    [languages]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsedResult = Papa.parse<{ language_code?: string; text?: string }>(
        text,
        { header: true, skipEmptyLines: true }
      );
      const rows = (parsedResult.data ?? []).map((r) => ({
        language_code: r.language_code ?? "",
        text: r.text ?? "",
      }));
      setParsed(validateRows(rows));
    };
    reader.readAsText(f);
  };

  const handleConfirm = async () => {
    if (parsed.length === 0) {
      toast.error("No rows to import");
      return;
    }
    setImporting(true);
    try {
      const res = await bulkImportSentences(
        parsed.map((p) => ({ language_code: p.language_code, text: p.text }))
      );
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResult({
        inserted: res.inserted,
        skipped: res.skipped,
        errors: res.errors,
      });
      toast.success(
        `Imported ${res.inserted} sentences. ${res.skipped} skipped.`
      );
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsed([]);
    setResult(null);
    onClose();
  };

  const validCount = parsed.filter((p) => !p.error).length;
  const errorCount = parsed.filter((p) => p.error).length;
  const duplicateCount = parsed.filter((p) => p.isDuplicate).length;

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Upload CSV"
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </GlassButton>
          {!result && parsed.length > 0 && (
            <GlassButton
              onClick={handleConfirm}
              loading={importing}
              disabled={importing || validCount === 0}
            >
              Import {validCount} row{validCount !== 1 ? "s" : ""}
            </GlassButton>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            CSV file
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-accent-blue/20 file:px-4 file:py-2 file:text-accent-blue"
          />
          <p className="mt-1.5 text-xs text-white/60">
            Format: language_code,text (header required). Example: en,The quick brown fox...
          </p>
        </div>

        {result && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white">
              Inserted: {result.inserted} | Skipped: {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-24 overflow-y-auto text-sm text-accent-red">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {parsed.length > 0 && !result && (
          <>
            <p className="text-sm text-white/60">
              Total: {parsed.length} | Valid: {validCount} | Errors: {errorCount}
              {duplicateCount > 0 && ` | Duplicates: ${duplicateCount}`}
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Text</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 10).map((row) => (
                    <tr
                      key={row.index}
                      className={`border-b border-white/5 ${
                        row.error ? "bg-accent-red/10" : ""
                      }`}
                    >
                      <td className="px-3 py-2">{row.index}</td>
                      <td className="px-3 py-2">{row.language_code}</td>
                      <td className="max-w-[200px] truncate px-3 py-2">
                        {row.text}
                      </td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="text-accent-red">{row.error}</span>
                        ) : row.isDuplicate ? (
                          <span className="text-accent-yellow">Duplicate</span>
                        ) : (
                          <span className="text-accent-green">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 10 && (
              <p className="mt-2 text-xs text-white/50">
                Showing first 10 of {parsed.length} rows
              </p>
            )}
          </>
        )}
      </div>
    </GlassModal>
  );
}
