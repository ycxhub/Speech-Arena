"use client";

import { useState, useCallback, useMemo } from "react";
import Papa from "papaparse";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { bulkAddSentencesFromCsv } from "../actions";
import { toast } from "sonner";

type Language = { id: string; code: string; name: string };

interface CsvUploadModalProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  languages: Language[];
  onSuccess?: () => void;
}

type ParsedRow = {
  text: string;
  language: string;
  usecase: string;
  industry: string;
  index: number;
  error?: string;
  isDuplicate?: boolean;
};

export function PlaygroundCsvUploadModal({
  open,
  onClose,
  pageId,
  languages,
  onSuccess,
}: CsvUploadModalProps) {
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const codeSet = useMemo(
    () =>
      new Set(languages.map((l) => l.code.toLowerCase().replace("_", "-"))),
    [languages]
  );
  const hasAnyEn = useMemo(() => {
    const enCodes = ["en-us", "en-in", "en-uk", "en-au", "en-gb"];
    return enCodes.some((c) => codeSet.has(c));
  }, [codeSet]);

  const validateRows = useCallback(
    (rows: { text?: string; language?: string; usecase?: string; industry?: string }[]): ParsedRow[] => {
      const seen = new Set<string>();
      return rows.map((r, i) => {
        const text = r.text?.trim() ?? "";
        const lang = r.language?.trim().toLowerCase().replace("_", "-") ?? "";
        const usecase = r.usecase?.trim() ?? "";
        const industry = r.industry?.trim() ?? "";
        let error: string | undefined;
        let isDuplicate = false;

        if (!text) error = "Missing text";
        else if (text.length > 1000) error = "Text exceeds 1000 chars";
        if (!lang) error = (error ? `${error}; ` : "") + "Missing language";
        else if (
          !codeSet.has(lang) &&
          !(hasAnyEn && (lang === "en" || lang.startsWith("en-")))
        )
          error = (error ? `${error}; ` : "") + `Unknown language "${lang}"`;

        const key = `${lang}:${text}`;
        if (!error && seen.has(key)) isDuplicate = true;
        if (!error) seen.add(key);

        return {
          text,
          language: (lang || r.language) ?? "",
          usecase,
          industry,
          index: i + 1,
          error,
          isDuplicate,
        };
      });
    },
    [codeSet, hasAnyEn]
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
      const parsedResult = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      const rows = (parsedResult.data ?? []).map((r) => {
        const keys = Object.keys(r).reduce(
          (acc, k) => ({ ...acc, [k.toLowerCase().trim()]: (r as Record<string, string>)[k] }),
          {} as Record<string, string>
        );
        return {
          text: keys.text ?? keys["sentence text"] ?? "",
          language: keys.language ?? keys.lang ?? "",
          usecase: keys.usecase ?? "",
          industry: keys.industry ?? "",
        };
      });
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
      const validRows = parsed.filter((p) => !p.error);
      const res = await bulkAddSentencesFromCsv(
        pageId,
        validRows.map((p) => ({
          text: p.text,
          language: p.language,
          usecase: p.usecase || undefined,
          industry: p.industry || undefined,
        }))
      );
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResult({
        inserted: res.inserted ?? 0,
        skipped: res.skipped ?? 0,
        errors: res.errors ?? [],
      });
      toast.success(`Imported ${res.inserted ?? 0} sentences.`);
      onSuccess?.();
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
          <label className="mb-1.5 block text-sm font-medium text-white">
            CSV file
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-accent-blue/20 file:px-4 file:py-2 file:text-accent-blue"
          />
          <p className="mt-1.5 text-xs text-white/60">
            Format: text,language,usecase,industry (header required). Languages:
            use codes like en-us, en-in. Sentences with en-* apply to all
            en-us, en-in, en-uk, en-au, en-gb.
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
                  <tr className="border-b border-white/10 text-white">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Text</th>
                    <th className="px-3 py-2">Lang</th>
                    <th className="px-3 py-2">Usecase</th>
                    <th className="px-3 py-2">Industry</th>
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
                      <td className="px-3 py-2 text-white">{row.index}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-white">
                        {row.text}
                      </td>
                      <td className="px-3 py-2 text-white/80">{row.language}</td>
                      <td className="px-3 py-2 text-white/80">
                        {row.usecase || "—"}
                      </td>
                      <td className="px-3 py-2 text-white/80">
                        {row.industry || "—"}
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
