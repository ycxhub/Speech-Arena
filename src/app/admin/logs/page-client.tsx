"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassBadge } from "@/components/ui/glass-badge";
import { getSignedLogAudioUrl, exportLogsCsv } from "./actions";
import type { LogRow, LogFilters } from "./actions";
import { toast } from "sonner";

type Props = {
  initialRows: LogRow[];
  total: number;
  page: number;
  providers: { id: string; name: string }[];
  languages: { id: string; code: string }[];
  models: { id: string; name: string; provider_id: string }[];
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(s: string, len: number): string {
  return s.length <= len ? s : s.slice(0, len) + "…";
}

function AudioBtn({ audioFileId }: { audioFileId: string }) {
  const [loading, setLoading] = useState(false);
  const handlePlay = async () => {
    setLoading(true);
    const { url, error } = await getSignedLogAudioUrl(audioFileId);
    setLoading(false);
    if (error || !url) {
      toast.error("Could not load audio");
      return;
    }
    const audio = new Audio(url);
    audio.onerror = () => toast.error("Playback failed");
    audio.play();
  };
  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={loading}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-accent-blue hover:bg-accent-blue/20 disabled:opacity-50"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      ) : (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}

export function LogsClient({
  initialRows,
  total,
  page,
  providers,
  languages,
  models,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [anonymize, setAnonymize] = useState(true);

  const userQuery = searchParams.get("user") ?? "";
  const providerId = searchParams.get("provider") ?? "";
  const modelId = searchParams.get("model") ?? "";
  const languageId = searchParams.get("language") ?? "";
  const status = searchParams.get("status") ?? "all";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.set("page", "1");
    router.push(`/admin/logs?${params.toString()}`);
  };

  const handleExport = async () => {
    setExporting(true);
    const filters: LogFilters = {
      userQuery: userQuery || undefined,
      providerId: providerId || undefined,
      modelId: modelId || undefined,
      languageId: languageId || undefined,
      status: status !== "all" ? status : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };
    const result = await exportLogsCsv(filters, anonymize);
    setExporting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.warning) toast.warning(result.warning);
    if (result.csv && result.filename) {
      const blob = new Blob([result.csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Export downloaded");
    }
  };

  // Poll for real-time updates when there are pending rows
  const hasPendingRows = initialRows.some((r) => r.status === "pending");
  useEffect(() => {
    if (!hasPendingRows) return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [hasPendingRows, router]);

  const filters = (
    <GlassCard className="mb-4">
      <div className="flex flex-nowrap items-end gap-3 overflow-x-auto pb-2">
        <div className="flex shrink-0 items-end gap-3">
          <GlassInput
            label="User / Email"
            placeholder="Search..."
            value={userQuery}
            onChange={(e) => updateUrl({ user: e.target.value })}
            className="w-40 shrink-0"
          />
          <GlassSelect
            label="Provider"
            options={[
              { value: "", label: "All" },
              ...providers.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={providerId}
            onChange={(e) => updateUrl({ provider: e.target.value, model: "" })}
            className="w-32 shrink-0"
          />
          <GlassSelect
            label="Model"
            options={[
              { value: "", label: "All" },
              ...models
                .filter((m) => !providerId || m.provider_id === providerId)
                .map((m) => ({ value: m.id, label: m.name })),
            ]}
            value={modelId}
            onChange={(e) => updateUrl({ model: e.target.value })}
            className="w-32 shrink-0"
          />
          <GlassSelect
            label="Language"
            options={[
              { value: "", label: "All" },
              ...languages.map((l) => ({ value: l.id, label: l.code })),
            ]}
            value={languageId}
            onChange={(e) => updateUrl({ language: e.target.value })}
            className="w-28 shrink-0"
          />
          <GlassSelect
            label="Status"
            options={[
              { value: "all", label: "All" },
              { value: "completed", label: "Completed" },
              { value: "pending", label: "Pending" },
              { value: "invalid", label: "Invalid" },
            ]}
            value={status}
            onChange={(e) => updateUrl({ status: e.target.value })}
            className="w-28 shrink-0"
          />
          <GlassInput
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => updateUrl({ from: e.target.value })}
            className="w-32 shrink-0"
          />
          <GlassInput
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => updateUrl({ to: e.target.value })}
            className="w-32 shrink-0"
          />
        </div>
        <div className="flex shrink-0 items-end gap-2">
          <GlassButton size="sm" variant="secondary" onClick={() => router.push("/admin/logs")}>
            Clear
          </GlassButton>
          <label className="flex shrink-0 items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
            />
            Anonymize
          </label>
          <GlassButton size="sm" onClick={handleExport} loading={exporting}>
            Export CSV
          </GlassButton>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => updateUrl({ status: "invalid" })}
          className="text-accent-orange hover:underline"
        >
          Invalid rounds
        </button>
        <span className="text-white/40">|</span>
        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            updateUrl({ from: today, to: today });
          }}
          className="text-accent-blue hover:underline"
        >
          Last 24 hours
        </button>
        <span className="text-white/40">|</span>
        <button
          type="button"
          onClick={() => updateUrl({ suspicious: "1" })}
          className="text-accent-red hover:underline"
          title="listen_time < 3000ms"
        >
          Suspicious votes
        </button>
      </div>
    </GlassCard>
  );

  return (
    <div>
      {filters}
      <GlassCard>
        <GlassTable<LogRow>
          columns={[
            { key: "votedAt", header: "Timestamp", render: (r) => formatTimestamp(r.votedAt) },
            { key: "userEmail", header: "User" },
            { key: "languageName", header: "Language" },
            {
              key: "sentenceText",
              header: "Sentence",
              render: (r) => <span title={r.sentenceText}>{truncate(r.sentenceText, 40)}</span>,
            },
            {
              key: "modelA",
              header: "Model A",
              render: (r) => `${r.modelAName} (${r.modelAProvider})`,
            },
            {
              key: "modelB",
              header: "Model B",
              render: (r) => `${r.modelBName} (${r.modelBProvider})`,
            },
            {
              key: "winnerName",
              header: "Winner",
              render: (r) => <span className="text-accent-green">{r.winnerName}</span>,
            },
            {
              key: "loserName",
              header: "Loser",
              render: (r) => <span className="text-accent-red">{r.loserName}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <GlassBadge
                  color={
                    r.status === "completed"
                      ? "green"
                      : r.status === "invalid"
                        ? "red"
                        : "yellow"
                  }
                >
                  {r.status}
                </GlassBadge>
              ),
            },
          ]}
          data={initialRows}
          onRowClick={(r) => setExpandedId(expandedId === r.id ? null : r.id)}
        />
        {expandedId && (
          <LogDetailRow
            row={initialRows.find((r) => r.id === expandedId)!}
            onClose={() => setExpandedId(null)}
          />
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-white/60">
            Page {page} of {Math.max(1, Math.ceil(total / 50))} ({total} total)
          </span>
          <div className="flex gap-2">
            <GlassButton
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                router.push(`/admin/logs?${params.toString()}`);
              }}
            >
              Previous
            </GlassButton>
            <GlassButton
              size="sm"
              variant="secondary"
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page + 1));
                router.push(`/admin/logs?${params.toString()}`);
              }}
            >
              Next
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function LogDetailRow({ row, onClose }: { row: LogRow; onClose: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex justify-between">
        <span className="font-medium">Details</span>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/60 hover:text-white"
        >
          Close
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="text-white/60">Full sentence</p>
          <p className="break-words">{row.sentenceText}</p>
        </div>
        <div>
          <p className="text-white/60">Listen times</p>
          <p>A: {row.listenTimeAMs ?? "-"} ms | B: {row.listenTimeBMs ?? "-"} ms</p>
        </div>
        <div>
          <p className="text-white/60">ELO (Winner)</p>
          <p>{row.eloBeforeWinner ?? "-"} → {row.eloAfterWinner ?? "-"}</p>
        </div>
        <div>
          <p className="text-white/60">ELO (Loser)</p>
          <p>{row.eloBeforeLoser ?? "-"} → {row.eloAfterLoser ?? "-"}</p>
        </div>
        <div>
          <p className="text-white/60">Audio A</p>
          <AudioBtn audioFileId={row.audioAId} />
          {row.generationLatencyAMs != null && (
            <span className="ml-2 text-white/60">({row.generationLatencyAMs}ms)</span>
          )}
        </div>
        <div>
          <p className="text-white/60">Audio B</p>
          <AudioBtn audioFileId={row.audioBId} />
          {row.generationLatencyBMs != null && (
            <span className="ml-2 text-white/60">({row.generationLatencyBMs}ms)</span>
          )}
        </div>
      </div>
    </div>
  );
}
