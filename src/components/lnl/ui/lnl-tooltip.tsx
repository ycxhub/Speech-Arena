"use client";

import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

export interface LnlTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  /** Use for multi-line content (e.g. max-w-xs whitespace-normal) */
  contentClassName?: string;
}

const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function LnlTooltip({
  content,
  children,
  position = "top",
  className,
  contentClassName,
}: LnlTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "pointer-events-none absolute z-50 rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-200 shadow-lg",
            contentClassName ?? "whitespace-nowrap",
            positionStyles[position]
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
