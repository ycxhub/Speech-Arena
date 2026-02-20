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

export async function generateCsvExport(
  taskId: string,
  filters?: ExportFilters
): Promise<string> {
  const adminClient = getAdminClient();

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

    lines.push(
      [
        row.item_id,
        item?.item_index ?? "",
        escapeCsv(extractAudioFilename(item?.audio_url ?? "")),
        escapeCsv(item?.text ?? ""),
        escapeCsv(email),
        row.updated_at ?? row.created_at ?? "",
        escapeCsv(JSON.stringify(row.labels ?? [])),
        escapeCsv(JSON.stringify(row.boolean_answers ?? {})),
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
