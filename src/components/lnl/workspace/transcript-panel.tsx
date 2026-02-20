"use client";

import { useState, useCallback } from "react";
import { WordToken } from "./word-token";

interface WordLabel {
  start_word_index: number;
  end_word_index: number;
  label_name: string;
  color: string;
  comment: string;
}

interface Props {
  text: string;
  labels: WordLabel[];
  selectedWordIndices: Set<number>;
  onWordClick: (index: number) => void;
  onWordRangeSelect: (startIndex: number, endIndex: number) => void;
  onWordContextMenu: (e: React.MouseEvent, index: number) => void;
  isVisible: boolean;
  labelColors: Record<string, string>;
}

export function TranscriptPanel({
  text,
  labels,
  selectedWordIndices,
  onWordClick,
  onWordRangeSelect,
  onWordContextMenu,
  isVisible,
  labelColors,
}: Props) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const words = text.split(/\s+/).filter(Boolean);
  const isEmpty = words.length === 0;

  const getLabelsForWord = useCallback(
    (index: number) => {
      return labels
        .filter((l) => index >= l.start_word_index && index <= l.end_word_index)
        .map((l) => ({
          label_name: l.label_name,
          color: labelColors[l.label_name] || l.color || "#6b7280",
        }));
    },
    [labels, labelColors]
  );

  function handleMouseDown(index: number) {
    setDragStart(index);
    setIsDragging(false);
  }

  function handleMouseEnter(index: number) {
    if (dragStart !== null && index !== dragStart) {
      setIsDragging(true);
    }
  }

  function handleMouseUp() {
    if (dragStart !== null && isDragging) {
      const endIndex = Array.from(selectedWordIndices).pop() ?? dragStart;
      const start = Math.min(dragStart, endIndex);
      const end = Math.max(dragStart, endIndex);
      onWordRangeSelect(start, end);
    }
    setDragStart(null);
    setIsDragging(false);
  }

  function handleClick(index: number) {
    if (!isDragging) {
      onWordClick(index);
    }
  }

  if (!isVisible) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-8 text-center text-sm text-neutral-600">
        Transcript hidden
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-8 text-center text-sm text-neutral-500">
        No transcript available
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex flex-wrap gap-x-1.5 gap-y-1 text-base leading-relaxed">
        {words.map((word, i) => (
          <WordToken
            key={i}
            word={word}
            index={i}
            isSelected={
              selectedWordIndices.has(i) ||
              (dragStart !== null &&
                i >= Math.min(dragStart, [...selectedWordIndices].pop() ?? dragStart) &&
                i <= Math.max(dragStart, [...selectedWordIndices].pop() ?? dragStart))
            }
            labels={getLabelsForWord(i)}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onContextMenu={onWordContextMenu}
          />
        ))}
      </div>
    </div>
  );
}
