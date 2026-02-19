"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { bulkCreateVoicesFromCsv, type CsvVoiceRow } from "./actions";
import { toast } from "sonner";

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  onSuccess?: () => void;
}

const EXPECTED_HEADERS = ["voice_name", "voice_id", "model_id", "language_code", "gender"];

function parseCsv(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });
  return result.data ?? [];
}

function toCsvRows(parsed: Record<string, string>[]): CsvVoiceRow[] {
  return parsed
    .map((row) => {
      const lang = (row.language_code ?? row.language_id ?? "").trim();
      return {
        voice_name: (row.voice_name ?? "").trim(),
        voice_id: (row.voice_id ?? "").trim(),
        model_id: (row.model_id ?? "").trim(),
        language_code: lang,
        gender: (row.gender ?? "").trim(),
      };
    })
    .filter((r) => r.voice_id || r.model_id || r.language_code || r.gender);
}

export function ImportCsvModal({ open, onClose, providerId, onSuccess }: ImportCsvModalProps) {
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setError(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) {
      setError("No valid rows found. Expected headers: voice_name, voice_id, model_id, language_code, gender");
      return;
    }
    const rows = toCsvRows(parsed);
    if (rows.length === 0) {
      setError("No valid rows to import");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await bulkCreateVoicesFromCsv(providerId, rows);
      if (result.error) {
        setError(result.error);
        return;
      }
      if ((result.created ?? 0) > 0) {
        toast.success(`Imported ${result.created} voices${result.skipped ? ` (${result.skipped} skipped)` : ""}`);
        onClose();
        onSuccess?.();
        setCsvText("");
      } else {
        setError(
          result.details
            ? `No voices imported. ${result.details}`
            : "No voices imported. Check that model_id exists for this provider, language_code is valid (e.g. en-US), and gender is male/female/neutral."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCsvText("");
    setError(null);
    onClose();
  };

  const parsedCount = parseCsv(csvText).length;

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Import voices from CSV"
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton onClick={handleSubmit} loading={loading} disabled={loading || parsedCount === 0}>
            Import
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Expected headers: <code className="rounded bg-white/10 px-1">{EXPECTED_HEADERS.join(", ")}</code>
        </p>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <GlassButton variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Choose file
          </GlassButton>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">Or paste CSV</label>
          <textarea
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/40 focus:border-accent-blue/50 focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
            rows={8}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setError(null);
            }}
            placeholder={`voice_name,voice_id,model_id,language_code,gender\nMy Voice,v_abc123,eleven_multilingual_v2,en-US,male`}
          />
        </div>
        {parsedCount > 0 && (
          <p className="text-sm text-white/60">{parsedCount} row(s) detected</p>
        )}
        {error && (
          <p className="text-sm text-accent-red" role="alert">
            {error}
          </p>
        )}
      </div>
    </GlassModal>
  );
}
