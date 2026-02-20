"use client";

import { useState, useRef, useCallback } from "react";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { parseAndValidateCsv, type ParseResult } from "@/lib/lnl/csv-parser";
import { CsvPreviewTable } from "./csv-preview-table";

interface Props {
  taskId: string;
  onUploadComplete: () => void;
}

export function CsvUploadForm({ taskId, onUploadComplete }: Props) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleValidate = useCallback(async () => {
    if (!csvFile) return;
    const csvContent = await csvFile.text();
    const audioNames = audioFiles.map((f) => f.name);
    const result = parseAndValidateCsv(csvContent, audioNames);
    setParseResult(result);
  }, [csvFile, audioFiles]);

  async function handleUpload() {
    if (!parseResult || !parseResult.valid) return;
    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("csv", csvFile!);
    for (const file of audioFiles) {
      formData.append("audio", file);
    }

    try {
      const res = await fetch(
        `/api/listen-and-log/tasks/${taskId}/items/bulk`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (!res.ok) {
        setUploadMessage(`Error: ${data.error || "Upload failed"}`);
      } else {
        setUploadMessage(
          `Successfully uploaded ${data.itemsCreated} items.` +
          (data.errors?.length ? ` ${data.errors.length} errors.` : "")
        );
        onUploadComplete();
      }
    } catch {
      setUploadMessage("Network error. Please try again.");
    }

    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csv = files.find((f) => f.name.endsWith(".csv"));
    if (csv) setCsvFile(csv);
    const audio = files.filter(
      (f) => !f.name.endsWith(".csv") && !f.name.endsWith(".zip")
    );
    if (audio.length > 0) setAudioFiles((prev) => [...prev, ...audio]);
  }

  return (
    <div className="flex flex-col gap-4">
      <LnlCard
        className="border-dashed"
        padding="lg"
      >
        <div
          className="flex flex-col items-center gap-3 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <svg className="size-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm text-neutral-400">
            Drag & drop files here, or use the buttons below
          </p>

          <div className="flex gap-3">
            <LnlButton
              variant="secondary"
              size="sm"
              onClick={() => csvInputRef.current?.click()}
            >
              {csvFile ? `CSV: ${csvFile.name}` : "Select CSV"}
            </LnlButton>
            <LnlButton
              variant="secondary"
              size="sm"
              onClick={() => audioInputRef.current?.click()}
            >
              {audioFiles.length > 0
                ? `${audioFiles.length} audio files`
                : "Select Audio Files"}
            </LnlButton>
          </div>

          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setCsvFile(f);
            }}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.flac,.m4a"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setAudioFiles((prev) => [...prev, ...files]);
            }}
          />
        </div>
      </LnlCard>

      {csvFile && (
        <LnlButton
          variant="secondary"
          onClick={handleValidate}
          disabled={!csvFile}
        >
          Validate & Preview
        </LnlButton>
      )}

      {parseResult && (
        <>
          <CsvPreviewTable result={parseResult} />
          {parseResult.valid && (
            <LnlButton
              onClick={handleUpload}
              loading={uploading}
            >
              Confirm Upload ({parseResult.rows.length} items)
            </LnlButton>
          )}
        </>
      )}

      {uploadMessage && (
        <p
          className={`text-sm ${
            uploadMessage.startsWith("Error")
              ? "text-red-400"
              : "text-emerald-400"
          }`}
        >
          {uploadMessage}
        </p>
      )}
    </div>
  );
}
