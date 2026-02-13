"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { updateSentence } from "./actions";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { SentenceRow } from "./page";

type VersionRow = {
  version: number;
  text: string;
  created_at: string;
  editor_email: string | null;
};

interface EditSentenceModalProps {
  open: boolean;
  onClose: () => void;
  sentence: SentenceRow | null;
  onSuccess?: () => void;
}

export function EditSentenceModal({
  open,
  onClose,
  sentence,
  onSuccess,
}: EditSentenceModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);

  useEffect(() => {
    if (sentence && open) {
      setText(sentence.text);
      setTextError(null);
    }
  }, [sentence, open]);

  useEffect(() => {
    if (!sentence?.id || !open) return;
    const fetchVersions = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sentence_versions")
        .select("version, text, created_at, created_by")
        .eq("sentence_id", sentence.id)
        .order("version", { ascending: false });

      if (!data) {
        setVersions([]);
        return;
      }

      const ids = [...new Set(data.map((d) => d.created_by).filter((id): id is string => id != null))];
      let emails: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", ids as string[]);
        emails = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, p.email])
        );
      }

      setVersions(
        data.map((d) => ({
          version: d.version,
          text: d.text,
          created_at: d.created_at,
          editor_email: d.created_by ? emails[d.created_by] ?? null : null,
        }))
      );
    };
    fetchVersions();
  }, [sentence?.id, open]);

  const validate = () => {
    if (!text.trim()) {
      setTextError("Sentence text is required");
      return false;
    }
    if (text.trim().length > 500) {
      setTextError("Sentence must be 500 characters or less");
      return false;
    }
    setTextError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!sentence || !validate()) return;
    setLoading(true);
    try {
      const result = await updateSentence(sentence.id, text.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Sentence updated");
      onClose();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText("");
    setTextError(null);
    onClose();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Edit Sentence"
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Save
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            Sentence text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={6}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-accent-blue/50 focus:outline-none focus:ring-1 focus:ring-accent-blue/30"
            placeholder="Enter the sentence text..."
          />
          <p className="mt-1.5 text-sm text-white/60">
            {text.length}/500 characters
          </p>
          {textError && (
            <p className="mt-1.5 text-sm text-accent-red" role="alert">
              {textError}
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-white/80">
            Version history
          </h3>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
            {versions.length === 0 ? (
              <p className="text-sm text-white/50">No version history yet.</p>
            ) : (
              <ul className="space-y-3">
                {versions.map((v) => (
                  <li
                    key={v.version}
                    className="rounded border border-white/5 bg-white/[0.02] p-2 text-sm"
                  >
                    <div className="mb-1 flex items-center justify-between text-white/60">
                      <span>v{v.version}</span>
                      <span>
                        {formatDate(v.created_at)}
                        {v.editor_email && ` · ${v.editor_email}`}
                      </span>
                    </div>
                    <p className="text-white break-words">{v.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
