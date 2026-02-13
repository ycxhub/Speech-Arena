"use client";

import { useState } from "react";
import { toggleProviderActive } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProviderToggleProps {
  providerId: string;
  isActive: boolean;
}

export function ProviderToggle({ providerId, isActive }: ProviderToggleProps) {
  const [checked, setChecked] = useState(isActive);
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (loading) return;
    if (checked) {
      const okay = window.confirm(
        "Deactivating this provider will remove all its models from matchmaking. Continue?"
      );
      if (!okay) return;
    }
    setLoading(true);
    try {
      const result = await toggleProviderActive(providerId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setChecked(!checked);
      toast.success(checked ? "Provider deactivated" : "Provider activated");
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
