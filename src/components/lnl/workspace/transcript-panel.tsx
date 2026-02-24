"use client";

import { useState, useCallback, useRef } from "react";
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
  onSelectEntireSentence?: () => void;
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
  onSelectEntireSentence,
  isVisible,
  labelColors,
}: Props) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const justCompletedDrag = useRef(false);

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
    setDragEnd(index);
    setIsDragging(false);
  }

  function handleMouseEnter(index: number) {
    if (dragStart !== null) {
      setDragEnd(index);
      if (index !== dragStart) setIsDragging(true);
    }
  }

  function handleMouseUp() {
    if (dragStart !== null && isDragging && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      onWordRangeSelect(start, end);
      justCompletedDrag.current = true;
    }
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
  }

  function handleClick(index: number, event?: React.MouseEvent) {
    if (justCompletedDrag.current) {
      justCompletedDrag.current = false;
      return;
    }
    if (isDragging) return;
    if (event?.shiftKey) {
      const selected = Array.from(selectedWordIndices);
      const minIdx = selected.length > 0 ? Math.min(...selected, index) : index;
      const maxIdx = selected.length > 0 ? Math.max(...selected, index) : index;
      onWordRangeSelect(minIdx, maxIdx);
    } else {
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

  const dragMin = dragStart !== null && dragEnd !== null ? Math.min(dragStart, dragEnd) : null;
  const dragMax = dragStart !== null && dragEnd !== null ? Math.max(dragStart, dragEnd) : null;

  return (
    <div className="flex flex-col gap-2">
      {onSelectEntireSentence && !isEmpty && (
        <button
          type="button"
          onClick={onSelectEntireSentence}
          className="self-start rounded-md border border-neutral-700 bg-neutral-800/50 px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
        >
          Select entire sentence
        </button>
      )}
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
                (dragMin !== null && dragMax !== null && i >= dragMin && i <= dragMax)
              }
              labels={getLabelsForWord(i)}
              onClick={(idx, e) => handleClick(idx, e)}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onContextMenu={onWordContextMenu}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
