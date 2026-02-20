"use client";

import { useState } from "react";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

interface AnnotatorOption {
  userId: string;
  email: string;
}

interface Props {
  taskId: string;
  annotators: AnnotatorOption[];
}

export function ExportControls({ taskId, annotators }: Props) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [annotator, setAnnotator] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (annotator) params.set("annotator", annotator);
      if (status) params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(
        `/api/listen-and-log/tasks/${taskId}/export?${params}`
      );
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lnl-export-${taskId}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  const copyApiUrl = () => {
    const params = new URLSearchParams({ format });
    if (annotator) params.set("annotator", annotator);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const url = `${window.location.origin}/api/listen-and-log/tasks/${taskId}/export?${params}`;
    navigator.clipboard.writeText(url);
    alert("API URL copied to clipboard");
  };

  const annotatorOptions = [
    { value: "", label: "All annotators" },
    ...annotators.map((a) => ({ value: a.userId, label: a.email })),
  ];

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "flagged", label: "Flagged" },
    { value: "reviewed", label: "Reviewed" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h3 className="text-sm font-semibold text-neutral-200">Export</h3>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Format</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`rounded border px-3 py-1.5 text-sm ${
                format === "csv"
                  ? "border-blue-600 bg-blue-600/20 text-blue-400"
                  : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => setFormat("json")}
              className={`rounded border px-3 py-1.5 text-sm ${
                format === "json"
                  ? "border-blue-600 bg-blue-600/20 text-blue-400"
                  : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs text-neutral-500">Annotator</label>
          <select
            value={annotator}
            onChange={(e) => setAnnotator(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200"
          >
            {annotatorOptions.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs text-neutral-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200"
          >
            {statusOptions.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-500">From date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-500">To date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <LnlButton
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? "Downloading..." : "Download"}
        </LnlButton>
        <LnlButton variant="secondary" size="sm" onClick={copyApiUrl}>
          Copy API URL
        </LnlButton>
      </div>
    </div>
  );
}
