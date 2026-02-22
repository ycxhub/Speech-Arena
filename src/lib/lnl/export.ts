import { getAdminClient } from "@/lib/supabase/admin";

export interface ExportFilters {
  annotator?: string;
  status?: string;
  from?: string;
  to?: string;
}

function extractAudioFilename(audioUrl: string): string {
  if (audioUrl.includes("/")) {
    return audioUrl.split("/").pop() ?? audioUrl;
  }
  return audioUrl;
}

interface LabelEntry {
  start_word_index: number;
  end_word_index: number;
  label_name: string;
  [key: string]: unknown;
}

function formatLabelsForExport(
  labels: LabelEntry[] | null,
  itemText: string
): string {
  if (!labels?.length) return "";
  const words = itemText.trim().split(/\s+/);
  return labels
    .map((l) => {
      const start = Math.max(0, l.start_word_index);
      const end = Math.min(words.length - 1, l.end_word_index);
      const selectedWords =
        start <= end ? words.slice(start, end + 1).join(" ") : "";
      return `${l.label_name}: ${selectedWords}`;
    })
    .join("; ");
}

function formatBooleanAnswersForExport(
  booleanAnswers: Record<string, boolean> | null,
  booleanQuestions: string[]
): string {
  if (!booleanAnswers || Object.keys(booleanAnswers).length === 0) return "";
  return Object.entries(booleanAnswers)
    .map(([key, val]) => {
      const q = booleanQuestions[parseInt(key, 10)];
      const question = q ?? `Q${key}`;
      const answer = val ? "Yes" : "No";
      return `${question}: ${answer}`;
    })
    .join("; ");
}

export async function generateCsvExport(
  taskId: string,
  filters?: ExportFilters
): Promise<string> {
  const adminClient = getAdminClient();

  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("task_options")
    .eq("id", taskId)
    .single();

  const taskOptions = (task?.task_options ?? {}) as {
    boolean_questions?: string[];
  };
  const booleanQuestions = taskOptions.boolean_questions ?? [];

  let query = adminClient
    .from("lnl_annotations")
    .select(
      `
      id,
      item_id,
      labels,
      boolean_answers,
      scores,
      overall_comment,
      status,
      time_spent_ms,
      created_at,
      updated_at,
      user_id,
      lnl_task_items!inner (
        item_index,
        audio_url,
        text
      )
    `
    )
    .eq("task_id", taskId)
    .eq("is_current", true);

  if (filters?.annotator) {
    query = query.eq("user_id", filters.annotator);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data: rows } = await query.order("created_at", { ascending: true });

  const userIds = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, email")
          .in("id", userIds)
      : { data: [] };
  const emailMap = new Map(
    (profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
  );

  const headers = [
    "item_id",
    "item_index",
    "audio_filename",
    "text",
    "annotator_email",
    "annotation_date",
    "labels",
    "boolean_answers",
    "scores",
    "overall_comment",
    "status",
    "time_spent_ms",
  ];

  const lines: string[] = [headers.map(escapeCsv).join(",")];

  for (const row of rows ?? []) {
    const item = row.lnl_task_items as
      | { item_index: number; audio_url: string; text: string }
      | null;
    const email = emailMap.get(row.user_id) ?? "Unknown";

    const labelsFormatted = formatLabelsForExport(
      row.labels as LabelEntry[] | null,
      item?.text ?? ""
    );
    const booleanFormatted = formatBooleanAnswersForExport(
      row.boolean_answers as Record<string, boolean> | null,
      booleanQuestions
    );

    lines.push(
      [
        row.item_id,
        item?.item_index ?? "",
        escapeCsv(extractAudioFilename(item?.audio_url ?? "")),
        escapeCsv(item?.text ?? ""),
        escapeCsv(email),
        row.updated_at ?? row.created_at ?? "",
        escapeCsv(labelsFormatted),
        escapeCsv(booleanFormatted),
        escapeCsv(JSON.stringify(row.scores ?? {})),
        escapeCsv(row.overall_comment ?? ""),
        row.status ?? "",
        row.time_spent_ms ?? "",
      ].join(",")
    );
  }

  return lines.join("\n");
}

function escapeCsv(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function generateJsonExport(
  taskId: string,
  filters?: ExportFilters
): Promise<object> {
  const adminClient = getAdminClient();

  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("id, name, tool_type, label_config, task_options")
    .eq("id", taskId)
    .single();

  let query = adminClient
    .from("lnl_annotations")
    .select(
      `
      id,
      item_id,
      version,
      labels,
      boolean_answers,
      scores,
      overall_comment,
      status,
      time_spent_ms,
      created_at,
      updated_at,
      user_id,
      lnl_task_items!inner (
        id,
        item_index,
        audio_url,
        text,
        ipa_text,
        normalized_text,
        metadata
      )
    `
    )
    .eq("task_id", taskId)
    .eq("is_current", true);

  if (filters?.annotator) {
    query = query.eq("user_id", filters.annotator);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data: rows } = await query.order("created_at", { ascending: true });

  const userIds = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, email")
          .in("id", userIds)
      : { data: [] };
  const emailMap = new Map(
    (profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
  );

  const annotations = (rows ?? []).map((row: { user_id: string; [k: string]: unknown }) => {
    const item = row.lnl_task_items as Record<string, unknown> | null;

    return {
      id: row.id,
      itemId: row.item_id,
      version: row.version,
      labels: row.labels,
      booleanAnswers: row.boolean_answers,
      scores: row.scores,
      overallComment: row.overall_comment,
      status: row.status,
      timeSpentMs: row.time_spent_ms,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      annotatorEmail: emailMap.get(row.user_id) ?? "Unknown",
      item: item
        ? {
            ...item,
            audioFilename: extractAudioFilename((item.audio_url as string) ?? ""),
          }
        : null,
    };
  });

  return {
    task: task ?? null,
    exportedAt: new Date().toISOString(),
    filters: filters ?? {},
    annotations,
  };
}
