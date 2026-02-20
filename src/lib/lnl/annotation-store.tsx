"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export interface LabelEntry {
  start_word_index: number;
  end_word_index: number;
  label_name: string;
  color: string;
  comment: string;
}

export interface AnnotationState {
  labels: LabelEntry[];
  booleanAnswers: Record<string, boolean>;
  scores: Record<string, number>;
  overallComment: string;
  status: string;
  selectedWordIndices: Set<number>;
  isDirty: boolean;
}

export interface AnnotationStoreContextValue extends AnnotationState {
  addLabel: (entry: Omit<LabelEntry, "color"> & { color?: string }) => void;
  removeLabel: (index: number) => void;
  removeLabelsOnWord: (wordIndex: number) => void;
  updateLabelComment: (index: number, comment: string) => void;
  updateBooleanAnswer: (id: string, value: boolean) => void;
  updateScore: (id: string, value: number) => void;
  updateOverallComment: (value: string) => void;
  setStatus: (status: string) => void;
  selectWords: (indices: Set<number>) => void;
  clearSelection: () => void;
  loadAnnotation: (data: {
    labels?: unknown;
    boolean_answers?: unknown;
    scores?: unknown;
    overall_comment?: string | null;
    status?: string;
  }) => void;
  markSaved: () => void;
  getSavePayload: () => {
    labels: LabelEntry[];
    booleanAnswers: Record<string, boolean>;
    scores: Record<string, number>;
    overallComment: string;
    status: string;
  };
}

const AnnotationStoreContext = createContext<AnnotationStoreContextValue | null>(
  null
);

interface AnnotationStoreProviderProps {
  children: ReactNode;
  taskId: string;
  itemId: string;
  labelColors: Record<string, string>;
  initialData?: {
    labels?: unknown;
    boolean_answers?: unknown;
    scores?: unknown;
    overall_comment?: string | null;
    status?: string;
  };
}

export function AnnotationStoreProvider({
  children,
  taskId: _taskId,
  itemId: _itemId,
  labelColors,
  initialData,
}: AnnotationStoreProviderProps) {
  const initialLabels = Array.isArray(initialData?.labels)
    ? (initialData.labels as LabelEntry[])
    : [];

  const [labels, setLabels] = useState<LabelEntry[]>(initialLabels);
  const [booleanAnswers, setBooleanAnswers] = useState<Record<string, boolean>>(
    (initialData?.boolean_answers as Record<string, boolean>) ?? {}
  );
  const [scores, setScores] = useState<Record<string, number>>(
    (initialData?.scores as Record<string, number>) ?? {}
  );
  const [overallComment, setOverallComment] = useState(
    initialData?.overall_comment ?? ""
  );
  const [status, setStatusState] = useState(initialData?.status ?? "in_progress");
  const [selectedWordIndices, setSelectedWordIndices] = useState<Set<number>>(
    new Set()
  );
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markSaved = useCallback(() => setIsDirty(false), []);

  const addLabel = useCallback(
    (entry: Omit<LabelEntry, "color"> & { color?: string }) => {
      const color = entry.color ?? labelColors[entry.label_name] ?? "#6b7280";
      setLabels((prev) => [
        ...prev,
        {
          ...entry,
          color,
        },
      ]);
      markDirty();
    },
    [labelColors, markDirty]
  );

  const removeLabel = useCallback(
    (index: number) => {
      setLabels((prev) => prev.filter((_, i) => i !== index));
      markDirty();
    },
    [markDirty]
  );

  const removeLabelsOnWord = useCallback(
    (wordIndex: number) => {
      setLabels((prev) =>
        prev.filter(
          (l) => !(wordIndex >= l.start_word_index && wordIndex <= l.end_word_index)
        )
      );
      markDirty();
    },
    [markDirty]
  );

  const updateLabelComment = useCallback(
    (index: number, comment: string) => {
      setLabels((prev) =>
        prev.map((l, i) => (i === index ? { ...l, comment } : l))
      );
      markDirty();
    },
    [markDirty]
  );

  const updateBooleanAnswer = useCallback(
    (id: string, value: boolean) => {
      setBooleanAnswers((prev) => ({ ...prev, [id]: value }));
      markDirty();
    },
    [markDirty]
  );

  const updateScore = useCallback(
    (id: string, value: number) => {
      setScores((prev) => ({ ...prev, [id]: value }));
      markDirty();
    },
    [markDirty]
  );

  const updateOverallComment = useCallback(
    (value: string) => {
      setOverallComment(value);
      markDirty();
    },
    [markDirty]
  );

  const setStatus = useCallback(
    (s: string) => {
      setStatusState(s);
      markDirty();
    },
    [markDirty]
  );

  const selectWords = useCallback((indices: Set<number>) => {
    setSelectedWordIndices(indices);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWordIndices(new Set());
  }, []);

  const loadAnnotation = useCallback(
    (data: {
      labels?: unknown;
      boolean_answers?: unknown;
      scores?: unknown;
      overall_comment?: string | null;
      status?: string;
    }) => {
      setLabels(
        Array.isArray(data.labels) ? (data.labels as LabelEntry[]) : []
      );
      setBooleanAnswers(
        (data.boolean_answers as Record<string, boolean>) ?? {}
      );
      setScores((data.scores as Record<string, number>) ?? {});
      setOverallComment(data.overall_comment ?? "");
      setStatusState(data.status ?? "in_progress");
      setIsDirty(false);
    },
    []
  );

  const getSavePayload = useCallback(
    () => ({
      labels,
      booleanAnswers,
      scores,
      overallComment,
      status,
    }),
    [labels, booleanAnswers, scores, overallComment, status]
  );

  const value = useMemo<AnnotationStoreContextValue>(
    () => ({
      labels,
      booleanAnswers,
      scores,
      overallComment,
      status,
      selectedWordIndices,
      isDirty,
      addLabel,
      removeLabel,
      removeLabelsOnWord,
      updateLabelComment,
      updateBooleanAnswer,
      updateScore,
      updateOverallComment,
      setStatus,
      selectWords,
      clearSelection,
      loadAnnotation,
      markSaved,
      getSavePayload,
    }),
    [
      labels,
      booleanAnswers,
      scores,
      overallComment,
      status,
      selectedWordIndices,
      isDirty,
      addLabel,
      removeLabel,
      removeLabelsOnWord,
      updateLabelComment,
      updateBooleanAnswer,
      updateScore,
      updateOverallComment,
      setStatus,
      selectWords,
      clearSelection,
      loadAnnotation,
      markSaved,
      getSavePayload,
    ]
  );

  return (
    <AnnotationStoreContext.Provider value={value}>
      {children}
    </AnnotationStoreContext.Provider>
  );
}

export function useAnnotationStore() {
  const ctx = useContext(AnnotationStoreContext);
  if (!ctx) throw new Error("useAnnotationStore must be used within AnnotationStoreProvider");
  return ctx;
}
