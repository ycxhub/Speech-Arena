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

function getSpanTextForLabel(
  labels: LabelEntry[] | null,
  labelName: string,
  itemText: string
): string {
  if (!labels?.length || !itemText) return "";
  const words = itemText.trim().split(/\s+/).filter(Boolean);
  const spans = labels
    .filter((l) => l.label_name === labelName)
    .map((l) => {
      const start = Math.max(0, l.start_word_index);
      const end = Math.min(words.length - 1, l.end_word_index);
      return start <= end ? words.slice(start, end + 1).join(" ") : "";
    })
    .filter(Boolean);
  return spans.join("; ");
}

export async function generateCsvExport(
  taskId: string,
  filters?: ExportFilters
): Promise<string> {
  const adminClient = getAdminClient();

  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("label_config, task_options")
    .eq("id", taskId)
    .single();

  const labelConfig = (task?.label_config ?? {}) as {
    labels?: Array<{ name: string }>;
  };
  const taskOptions = (task?.task_options ?? {}) as {
    boolean_questions?: string[];
    scoring_fields?: Array<{ name: string }>;
  };
  const labelNames = (labelConfig.labels ?? []).map((l) => l.name);
  const booleanQuestions = taskOptions.boolean_questions ?? [];
  const scoringFieldNames = (taskOptions.scoring_fields ?? []).map((f) => f.name);

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
    ...labelNames,
    ...booleanQuestions,
    ...scoringFieldNames,
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
    const labels = row.labels as LabelEntry[] | null;
    const booleanAnswers = row.boolean_answers as Record<string, boolean> | null;
    const scores = row.scores as Record<string, number> | null;
    const itemText = item?.text ?? "";

    const labelValues = labelNames.map((name) =>
      getSpanTextForLabel(labels, name, itemText)
    );
    const booleanValues = booleanQuestions.map((_, i) => {
      const val = booleanAnswers?.[String(i)];
      if (val === undefined) return "";
      return val ? "Yes" : "No";
    });
    const scoreValues = scoringFieldNames.map((name) => {
      const val = scores?.[name];
      return val !== undefined && val !== null ? String(val) : "";
    });

    lines.push(
      [
        row.item_id,
        item?.item_index ?? "",
        escapeCsv(extractAudioFilename(item?.audio_url ?? "")),
        escapeCsv(itemText),
        escapeCsv(email),
        row.updated_at ?? row.created_at ?? "",
        ...labelValues.map((v) => escapeCsv(v)),
        ...booleanValues.map((v) => escapeCsv(v)),
        ...scoreValues.map((v) => escapeCsv(v)),
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
