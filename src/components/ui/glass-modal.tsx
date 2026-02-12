"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function GlassModal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: GlassModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "glass-modal-title" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="flex flex-col gap-4">
          {title && (
            <h2
              id="glass-modal-title"
              className="text-xl font-semibold text-white"
            >
              {title}
            </h2>
          )}
          <div className="flex-1">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              {footer}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
