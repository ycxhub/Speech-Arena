"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassBadge } from "@/components/ui/glass-badge";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassInput } from "@/components/ui/glass-input";
import {
  getSignedAudioUrl,
  exportMyResultsCsv,
  type PersonalLeaderboardRow,
  type TestHistoryRow,
  type MyResultsFilters,
} from "./actions";
import { toast } from "sonner";

type FilterOptions = {
  languages: { id: string; name: string }[];
  providers: { id: string; name: string }[];
  models: { id: string; name: string; providerId: string }[];
};

type Props = {
  completedCount: number;
  initialLeaderboard: PersonalLeaderboardRow[];
  initialHistory: { rows: TestHistoryRow[]; total: number };
  filterOptions: FilterOptions;
};

const MIN_TESTS = 20;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(text: string, len: number): string {
  if (text.length <= len) return text;
  return text.slice(0, len) + "…";
}

function AudioPlayButton({ audioFileId }: { audioFileId: string }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    if (playing || loading) return;
    setLoading(true);
    const { url, error } = await getSignedAudioUrl(audioFileId);
    setLoading(false);
    if (error || !url) {
      toast.error("Could not load audio");
      return;
    }
    const audio = new Audio(url);
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      toast.error("Playback failed");
    };
    audio.play();
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={loading}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-accent-blue hover:bg-accent-blue/20 disabled:opacity-50"
      title="Play"
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

export function MyResultsClient({
  completedCount,
  initialLeaderboard,
  initialHistory,
  filterOptions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exporting, setExporting] = useState(false);

  const languageId = searchParams.get("language") ?? "";
  const providerId = searchParams.get("provider") ?? "";
  const modelId = searchParams.get("model") ?? "";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";

  const filters: MyResultsFilters = {
    ...(languageId && { languageId }),
    ...(providerId && { providerId }),
    ...(modelId && { modelId }),
    ...(fromDate && { fromDate }),
    ...(toDate && { toDate }),
  };

  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      params.set("page", "1");
      router.push(`/my-results?${params.toString()}`);
    },
    [router, searchParams]
  );

  // When URL changes, the page re-renders and passes new initialLeaderboard and initialHistory.
  // Actually the initial data is from server. When user changes filters via URL, we need to refetch.
  // The simplest approach: make the page a server component that reads searchParams and fetches.
  // So we don't need to refetch from client - we'll use router.push with new params and the page will re-render with new data.
  // So the client just updates URL, and we need the page to be dynamic (revalidate on each request) or we pass the data from page.
  // The page will read searchParams and pass initial data. When user changes filters, we update URL and the page will re-fetch (Next.js will re-run the server component).
  // So we need the client to update URL, and the parent page will re-render with new data. But the client has its own state for leaderboard and history. We need to either:
  // 1. Lift state to server - page always fetches based on URL, passes to client. Client only updates URL. Good.
  // 2. Client fetches when URL changes - but we need userId. We can pass userId from server.

  // Let me change approach: the page will pass all data based on URL. The client will only update the URL when filters change. When the URL changes, Next.js will re-render the page (if we use searchParams in the page), and new data will be passed. So we need the page to read searchParams and fetch accordingly.
  // The client will: 1) render the filter bar, 2) on filter change, update URL, 3) the page re-renders with new data.
  // So we should NOT store leaderboard/history in client state - we should use the props. When filters change, we update URL, and the parent will re-fetch. But Next.js client-side navigation might not re-run the server component... Actually it does - when you navigate to the same page with different query params, Next.js will re-fetch the RSC payload.
  // So the flow: Client updates URL -> Next.js fetches new RSC payload for /my-results?language=x -> Page re-renders with new data -> Client receives new props.
  // Good. So we use props for leaderboard and history, and we don't need local state for them. We only need local state for: historyPage (for pagination - but pagination could also be in URL), exporting.
  // Let me put pagination in URL too: ?page=2. Then the page fetches the correct page.
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/my-results?${params.toString()}`);
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportMyResultsCsv(filters);
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

  // We need userId for getTestHistory and exportMyResultsCsv. The page must pass it.
  // Let me add userId to the props.
  return (
    <div className="space-y-8">
      <h1 className="text-page-title">My Results</h1>

      {completedCount < MIN_TESTS && (
        <GlassCard className="border-accent-blue/30">
          <p className="mb-4 text-lg">
            Complete at least {MIN_TESTS} tests to unlock your full results.
          </p>
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm text-white/60">
              <span>Progress</span>
              <span>
                {completedCount} / {MIN_TESTS} tests completed
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent-blue transition-all"
                style={{ width: `${Math.min(100, (completedCount / MIN_TESTS) * 100)}%` }}
              />
            </div>
          </div>
          <Link href="/blind-test">
            <GlassButton accent="blue">Start Testing</GlassButton>
          </Link>
        </GlassCard>
      )}

      {/* Filter bar */}
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <GlassSelect
            label="Language"
            options={[
              { value: "", label: "All languages" },
              ...filterOptions.languages.map((l) => ({ value: l.id, label: l.name })),
            ]}
            value={languageId}
            onChange={(e) => updateUrl({ language: e.target.value })}
            className="w-40"
          />
          <GlassSelect
            label="Provider"
            options={[
              { value: "", label: "All providers" },
              ...filterOptions.providers.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={providerId}
            onChange={(e) => {
              updateUrl({ provider: e.target.value, model: "" });
            }}
            className="w-40"
          />
          <GlassSelect
            label="Model"
            options={[
              { value: "", label: "All models" },
              ...filterOptions.models
                .filter((m) => !providerId || m.providerId === providerId)
                .map((m) => ({ value: m.id, label: m.name })),
            ]}
            value={modelId}
            onChange={(e) => updateUrl({ model: e.target.value })}
            className="w-40"
          />
          <GlassInput
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => updateUrl({ from: e.target.value })}
            className="w-40"
          />
          <GlassInput
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => updateUrl({ to: e.target.value })}
            className="w-40"
          />
          <GlassButton
            size="sm"
            variant="secondary"
            onClick={() => router.push("/my-results")}
          >
            Clear
          </GlassButton>
          <GlassButton size="sm" onClick={handleExport} loading={exporting}>
            Export CSV
          </GlassButton>
        </div>
      </GlassCard>

      {/* Personal Leaderboard */}
      <GlassCard className={completedCount < MIN_TESTS ? "relative opacity-75" : ""}>
        <h2 className="mb-4 text-section-heading">Personal Leaderboard</h2>
        {completedCount < MIN_TESTS && initialLeaderboard.length > 0 && (
          <p className="mb-2 text-sm text-white/60">Not enough data for reliable ranking</p>
        )}
        <GlassTable<PersonalLeaderboardRow & { rank: number }>
          columns={[
            { key: "rank", header: "Rank", sortable: true },
            { key: "modelName", header: "Model" },
            { key: "providerName", header: "Provider" },
            {
              key: "winRate",
              header: "Win Rate",
              sortable: true,
              render: (r) => `${r.winRate.toFixed(1)}%`,
            },
            { key: "matchesPlayed", header: "Matches", sortable: true },
            {
              key: "userElo",
              header: "User ELO",
              sortable: true,
              render: (r) => r.userElo.toString(),
            },
            {
              key: "confidence",
              header: "Confidence",
              render: (r) => (
                <span
                  title={
                    r.confidence === "low"
                      ? "Not enough data for reliable ranking"
                      : undefined
                  }
                >
                  <GlassBadge
                    color={
                      r.confidence === "strong"
                        ? "green"
                        : r.confidence === "moderate"
                          ? "yellow"
                          : "red"
                    }
                  >
                    {r.confidence === "strong"
                      ? "Strong"
                      : r.confidence === "moderate"
                        ? "Moderate"
                        : "Low"}
                  </GlassBadge>
                </span>
              ),
            },
          ]}
          data={initialLeaderboard.map((r, i) => ({ ...r, rank: i + 1 }))}
        />
      </GlassCard>

      {/* Test History */}
      <GlassCard>
        <h2 className="mb-4 text-section-heading">Test History</h2>
        <GlassTable<TestHistoryRow>
          columns={[
            {
              key: "votedAt",
              header: "Timestamp",
              render: (r) => formatTimestamp(r.votedAt),
            },
            { key: "languageName", header: "Language" },
            {
              key: "sentenceText",
              header: "Sentence",
              render: (r) => (
                <span title={r.sentenceText}>{truncate(r.sentenceText, 60)}</span>
              ),
            },
            {
              key: "winnerName",
              header: "Winner",
              render: (r) => (
                <span className="text-accent-green">{r.winnerName}</span>
              ),
            },
            {
              key: "loserName",
              header: "Loser",
              render: (r) => (
                <span className="text-accent-red">{r.loserName}</span>
              ),
            },
            {
              key: "audioA",
              header: "Audio A",
              render: (r) => <AudioPlayButton audioFileId={r.audioAId} />,
            },
            {
              key: "audioB",
              header: "Audio B",
              render: (r) => <AudioPlayButton audioFileId={r.audioBId} />,
            },
          ]}
          data={initialHistory.rows}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-white/60">
            Page {page} of {Math.max(1, Math.ceil(initialHistory.total / 20))}
          </span>
          <div className="flex gap-2">
            <GlassButton
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </GlassButton>
            <GlassButton
              size="sm"
              variant="secondary"
              disabled={page >= Math.ceil(initialHistory.total / 20)}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
