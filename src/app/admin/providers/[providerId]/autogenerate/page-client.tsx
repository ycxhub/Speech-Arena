"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { getAutogeneratePreview, runAutogenerate, type AutogeneratePreviewRow } from "./actions";
import { toast } from "sonner";

interface AutogeneratePageClientProps {
  providerId: string;
  providerName: string;
}

export function AutogeneratePageClient({ providerId, providerName: _providerName }: AutogeneratePageClientProps) {
  const [preview, setPreview] = useState<AutogeneratePreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAutogeneratePreview(providerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setPreview(result.preview ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runAutogenerate(providerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Created ${result.created ?? 0} model(s)`);
        loadPreview();
      }
    } finally {
      setRunning(false);
    }
  };

  const toCreate = preview.filter((p) => p.will_create).length;
  const columns = [
    { key: "model_id", header: "Model ID" },
    { key: "voice_id", header: "Voice ID" },
    { key: "language_code", header: "Language" },
    { key: "gender", header: "Gender" },
    {
      key: "display_name",
      header: "Display Name",
      render: (row: AutogeneratePreviewRow) => (
        <span className="text-white/60">{row.display_name || "—"}</span>
      ),
    },
    {
      key: "will_create",
      header: "Action",
      render: (row: AutogeneratePreviewRow) => (
        <span className={row.will_create ? "text-accent-green" : "text-white/50"}>
          {row.will_create ? "Will create" : "Already exists"}
        </span>
      ),
    },
  ];

  return (
    <GlassCard>
      <h2 className="mb-2 text-lg font-medium text-white">Step 4: Autogenerate (Model, Voice, Language) Pairs</h2>
      <p className="mb-4 text-sm text-white/60">
        Creates models rows from your voice definitions. Each voice with a valid model_id will generate one (model, voice, language) pair.
      </p>

      <div className="mb-4 flex items-center gap-4">
        <GlassButton onClick={handleRun} loading={running} disabled={running || toCreate === 0}>
          Run Autogenerate
        </GlassButton>
        <Link href={`/admin/providers/${providerId}/models`}>
          <GlassButton variant="secondary">View Models</GlassButton>
        </Link>
      </div>

      {toCreate > 0 && (
        <p className="mb-4 text-sm text-accent-green">
          {toCreate} pair(s) will be created.
        </p>
      )}

      {preview.length === 0 && !loading ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <p className="mb-2 text-lg font-medium text-white">No voices to autogenerate</p>
          <p className="mb-6 text-sm text-white/60">
            Add model definitions, languages, and voices first. Voices must have model_id set.
          </p>
          <Link href={`/admin/providers/${providerId}/voices`}>
            <GlassButton variant="secondary">Go to Voices</GlassButton>
          </Link>
        </div>
      ) : (
        <GlassTable<AutogeneratePreviewRow>
          columns={columns}
          data={preview}
          loading={loading}
        />
      )}
    </GlassCard>
  );
}
