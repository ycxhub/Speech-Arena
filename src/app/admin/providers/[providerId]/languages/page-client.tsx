"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { updateProviderLanguages } from "./actions";
import { toast } from "sonner";

type Language = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

interface LanguagesPageClientProps {
  providerId: string;
  providerName: string;
  allLanguages: Language[];
  selectedLangIds: string[];
}

export function LanguagesPageClient({
  providerId,
  providerName: _providerName,
  allLanguages,
  selectedLangIds: initialSelected,
}: LanguagesPageClientProps) {
  const [selectedLangIds, setSelectedLangIds] = useState<Set<string>>(
    new Set(initialSelected)
  );
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (langId: string) => {
    setSelectedLangIds((prev) => {
      const next = new Set(prev);
      if (next.has(langId)) {
        next.delete(langId);
      } else {
        next.add(langId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateProviderLanguages(providerId, Array.from(selectedLangIds));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Languages updated");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="mb-4">
        <p className="text-sm text-white/60">
          Select which languages this provider supports. When adding models, you can only
          assign languages from this list.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {allLanguages.map((l) => (
          <label
            key={l.id}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            <input
              type="checkbox"
              checked={selectedLangIds.has(l.id)}
              onChange={() => toggleLanguage(l.id)}
              className="rounded border-white/20"
            />
            {l.code}
          </label>
        ))}
      </div>

      {allLanguages.length === 0 && (
        <p className="text-sm text-white/60">
          No languages in the system. Add languages from the main Languages page first.
        </p>
      )}

      <GlassButton onClick={handleSave} loading={loading} disabled={loading}>
        Save
      </GlassButton>
    </GlassCard>
  );
}
