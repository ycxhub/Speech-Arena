"use client";

import { cn } from "@/lib/utils";

interface LabelInfo {
  label_name: string;
  color: string;
}

interface Props {
  word: string;
  index: number;
  isSelected: boolean;
  labels: LabelInfo[];
  onClick: (index: number, event?: React.MouseEvent) => void;
  onMouseDown: (index: number) => void;
  onMouseEnter: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
}

export function WordToken({
  word,
  index,
  isSelected,
  labels,
  onClick,
  onMouseDown,
  onMouseEnter,
  onContextMenu,
}: Props) {
  return (
    <span
      className={cn(
        "relative inline-block cursor-pointer select-none rounded px-0.5 py-0.5 transition-colors",
        isSelected
          ? "bg-blue-500/25 text-blue-200"
          : labels.length > 0
            ? "text-neutral-100"
            : "text-neutral-300 hover:bg-neutral-800"
      )}
      onClick={(e) => onClick(index, e)}
      onMouseDown={(e) => {
        if (e.button === 0) onMouseDown(index);
      }}
      onMouseEnter={() => onMouseEnter(index)}
      onContextMenu={(e) => onContextMenu(e, index)}
      data-word-index={index}
    >
      {word}
      {labels.length > 0 && (
        <span className="absolute inset-x-0 bottom-0 flex gap-px">
          {labels.slice(0, 3).map((l, i) => (
            <span
              key={i}
              className="h-0.5 flex-1 rounded-full"
              style={{ backgroundColor: l.color }}
            />
          ))}
        </span>
      )}
    </span>
  );
}
