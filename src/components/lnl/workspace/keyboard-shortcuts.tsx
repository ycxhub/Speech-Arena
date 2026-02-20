"use client";

import { useEffect, useState } from "react";
import { LnlModal } from "@/components/lnl/ui/lnl-modal";

const SHORTCUTS: Array<{ keys: string; description: string }> = [
  { keys: "Space", description: "Play / Pause" },
  { keys: "← / →", description: "Skip 2 seconds" },
  { keys: "Home", description: "Restart from beginning" },
  { keys: "1–5", description: "Assign label (if configured)" },
  { keys: "Ctrl + →", description: "Next item" },
  { keys: "Ctrl + ←", description: "Previous item" },
  { keys: "Ctrl + F", description: "Flag item" },
  { keys: "Escape", description: "Clear word selection" },
  { keys: "[ / ]", description: "Loop segment (when supported)" },
  { keys: "?", description: "Show this help" },
];

export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (helpOpen && e.key === "Escape") {
        setHelpOpen(false);
        return;
      }

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-nextitem"));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-previtem"));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-flag"));
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-restart"));
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-playpause"));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-skipforward"));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-skipbackward"));
        return;
      }
      if (e.code === "BracketLeft" || e.code === "BracketRight") {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("lnl-shortcut-loop", {
            detail: { direction: e.code === "BracketRight" ? 1 : -1 },
          })
        );
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("lnl-shortcut-clearselection"));
        return;
      }
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        window.dispatchEvent(
          new CustomEvent("lnl-shortcut-assignlabel", {
            detail: { index: parseInt(e.key, 10) - 1 },
          })
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [helpOpen]);

  return (
    <LnlModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts">
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr
                key={s.keys}
                className="border-b border-neutral-800 last:border-b-0"
              >
                <td className="py-2 pr-4 font-mono text-neutral-300">
                  {s.keys}
                </td>
                <td className="py-2 text-neutral-400">{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LnlModal>
  );
}
