"use client";

import dynamic from "next/dynamic";
import { TranscriptPanel } from "./transcript-panel";
import { AdditionalFields } from "./additional-fields";
import { ProgressIndicator } from "./progress-indicator";
import { ItemNavigation } from "./item-navigation";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";

const AudioPlayer = dynamic(
  () => import("./audio-player").then((m) => ({ default: m.AudioPlayer })),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-lg bg-neutral-800" /> }
);

interface TaskConfig {
  id: string;
  name: string;
  label_config: {
    labels?: Array<{ name: string; color: string; shortcut_key: string; description: string }>;
  };
  task_options: {
    transcript_visibility?: string;
    show_ipa?: boolean;
    show_normalized_text?: boolean;
    per_label_comments?: boolean;
    overall_comment?: boolean;
  };
}

interface ItemData {
  id: string;
  item_index: number;
  audio_url: string;
  text: string;
  ipa_text?: string | null;
  normalized_text?: string | null;
  metadata?: Record<string, unknown>;
}

interface Props {
  taskConfig: TaskConfig;
  item: ItemData;
  totalItems: number;
  completedItems: number;
  itemIndex: number;
  annotationPanel: React.ReactNode;
  selectedWordIndices: Set<number>;
  labels: Array<{
    start_word_index: number;
    end_word_index: number;
    label_name: string;
    color: string;
    comment: string;
  }>;
  onWordClick?: (index: number) => void;
  onWordRangeSelect?: (start: number, end: number) => void;
  onWordContextMenu?: (e: React.MouseEvent, index: number) => void;
  onFlag?: () => void;
  onSkip?: () => void;
}

export function WorkspaceLayout({
  taskConfig,
  item,
  totalItems,
  completedItems,
  itemIndex,
  annotationPanel,
  selectedWordIndices,
  labels,
  onWordClick,
  onWordRangeSelect,
  onWordContextMenu,
  onFlag,
  onSkip,
}: Props) {
  const taskLabels = taskConfig.label_config.labels ?? [];
  const labelColors: Record<string, string> = {};
  for (const l of taskLabels) {
    labelColors[l.name] = l.color;
  }

  const transcriptVisible =
    taskConfig.task_options.transcript_visibility !== "hidden";

  return (
    <div className="flex h-full flex-col">
      <KeyboardShortcuts />
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: taskConfig.name, href: `/listen-and-log/tasks/${taskConfig.id}` },
          { label: `Item ${itemIndex}` },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <ProgressIndicator
              completed={completedItems}
              total={totalItems}
              size="sm"
            />
            <ItemNavigation
              itemIndex={itemIndex}
              totalItems={totalItems}
              basePath={`/listen-and-log/tasks/${taskConfig.id}`}
              onFlag={onFlag}
              onSkip={onSkip}
            />
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <AudioPlayer
            audioUrl={item.audio_url}
            onSkipItem={onSkip}
          />

          <TranscriptPanel
            text={item.text}
            labels={labels}
            selectedWordIndices={selectedWordIndices}
            onWordClick={onWordClick ?? (() => {})}
            onWordRangeSelect={onWordRangeSelect ?? (() => {})}
            onWordContextMenu={onWordContextMenu ?? (() => {})}
            isVisible={transcriptVisible}
            labelColors={labelColors}
          />

          <AdditionalFields
            ipaText={item.ipa_text}
            normalizedText={item.normalized_text}
            metadata={item.metadata as Record<string, unknown> | undefined}
            enabledFields={{
              show_ipa: taskConfig.task_options.show_ipa ?? false,
              show_normalized_text: taskConfig.task_options.show_normalized_text ?? false,
            }}
          />
        </div>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-800 bg-neutral-950">
          {annotationPanel}
        </aside>
      </div>
    </div>
  );
}
