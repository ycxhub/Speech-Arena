"use client";

import { useState, useEffect } from "react";
import { toggleLanguageActive } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  languageId: string;
  isActive: boolean;
}

export function LanguageToggle({ languageId, isActive }: LanguageToggleProps) {
  const [checked, setChecked] = useState(isActive);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChecked(isActive);
  }, [isActive]);

  const handleChange = async () => {
    if (loading) return;
    if (checked) {
      const okay = window.confirm(
        "Deactivating this language will hide it from the user-facing language picker. Existing sentences will remain. Continue?"
      );
      if (!okay) return;
    }
    setLoading(true);
    try {
      const result = await toggleLanguageActive(languageId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setChecked(!checked);
      toast.success(checked ? "Language deactivated" : "Language activated");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        handleChange();
      }}
      disabled={loading}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]",
        checked ? "bg-accent-blue/50" : "bg-white/10",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
