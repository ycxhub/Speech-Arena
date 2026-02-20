"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

interface Props {
  itemIndex: number;
  totalItems: number;
  basePath: string;
  onFlag?: () => void;
  onSkip?: () => void;
}

export function ItemNavigation({
  itemIndex,
  totalItems,
  basePath,
  onFlag,
  onSkip,
}: Props) {
  const router = useRouter();
  const [jumpValue, setJumpValue] = useState("");

  const goTo = useCallback(
    (index: number) => {
      if (index < 1 || index > totalItems) return;
      router.push(`${basePath}/items/${index}`);
    },
    [basePath, router, totalItems]
  );

  const handleJump = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = parseInt(jumpValue, 10);
      if (!isNaN(n) && n >= 1 && n <= totalItems) {
        goTo(n);
        setJumpValue("");
      }
    },
    [goTo, jumpValue, totalItems]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            if (itemIndex > 1) goTo(itemIndex - 1);
            break;
          case "ArrowRight":
            e.preventDefault();
            if (itemIndex < totalItems) goTo(itemIndex + 1);
            break;
          case "f":
          case "F":
            e.preventDefault();
            onFlag?.();
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemIndex, totalItems, goTo, onFlag]);

  return (
    <div className="flex items-center gap-2">
      <LnlButton
        variant="ghost"
        size="sm"
        disabled={itemIndex <= 1}
        onClick={() => goTo(itemIndex - 1)}
      >
        ← Prev
      </LnlButton>
      <LnlButton
        variant="ghost"
        size="sm"
        disabled={itemIndex >= totalItems}
        onClick={() => goTo(itemIndex + 1)}
      >
        Next →
      </LnlButton>

      <form onSubmit={handleJump} className="flex items-center gap-1">
        <span className="text-[11px] text-neutral-500">Go to</span>
        <input
          type="number"
          min={1}
          max={totalItems}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder={`1-${totalItems}`}
          className="w-16 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-xs tabular-nums text-neutral-200 focus:border-blue-600 focus:outline-none"
        />
        <LnlButton type="submit" variant="ghost" size="sm">
          Jump
        </LnlButton>
      </form>

      {onFlag && (
        <LnlButton
          variant="ghost"
          size="sm"
          onClick={onFlag}
          className="text-amber-500 hover:text-amber-400"
        >
          Flag
        </LnlButton>
      )}

      {onSkip && itemIndex < totalItems && (
        <LnlButton variant="ghost" size="sm" onClick={onSkip}>
          Skip
        </LnlButton>
      )}
    </div>
  );
}
