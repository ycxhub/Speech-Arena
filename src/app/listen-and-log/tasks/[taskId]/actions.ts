"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSignedUrl } from "@/lib/r2/storage";
import { generateLnLAudioForItem } from "@/lib/lnl/tts-generate";
import type { Database } from "@/types/database";
import {
  getDisplayOrder,
  displayIndexToItemIndex,
  itemIndexToDisplayIndex,
} from "@/lib/lnl/display-order";

export async function getTaskConfig(taskId: string) {
  const adminClient = getAdminClient();
  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("id, name, description, tool_type, label_config, task_options, status")
    .eq("id", taskId)
    .single();

  return task;
}

export async function getTaskItem(
  taskId: string,
  displayIndex: number,
  userId?: string
) {
  const adminClient = getAdminClient();

  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("task_options")
    .eq("id", taskId)
    .single();

  const taskOptions = (task?.task_options ?? {}) as { randomized_order?: boolean };
  const randomized = taskOptions.randomized_order === true;
  let actualItemIndex = displayIndex;

  if (randomized && userId) {
    const { count } = await adminClient
      .from("lnl_task_items")
      .select("*", { count: "exact", head: true })
      .eq("task_id", taskId);
    const total = count ?? 0;
    const displayOrder = getDisplayOrder(taskId, userId, total);
    actualItemIndex = displayIndexToItemIndex(displayIndex, displayOrder);
  }

  const { data: item } = await adminClient
    .from("lnl_task_items")
    .select("*")
    .eq("task_id", taskId)
    .eq("item_index", actualItemIndex)
    .single();

  if (!item) return null;

  let audioUrl = item.audio_url;
  // R2 keys (lnl/..., murf-ai/..., etc.) need signed URLs; only skip for full http(s) URLs
  if (audioUrl && !audioUrl.startsWith("http://") && !audioUrl.startsWith("https://")) {
    audioUrl = await getSignedUrl(audioUrl, 3600);
  }

  return { ...item, audio_url: audioUrl };
}

/**
 * Generate TTS audio for an item if missing. For annotators/auditors assigned to the task.
 */
export async function generateAndGetAudioUrl(
  taskId: string,
  itemId: string,
  userId: string
): Promise<{ signedUrl?: string; error?: string }> {
  const adminClient = getAdminClient();

  const { data: assignment } = await adminClient
    .from("lnl_task_assignments")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .single();

  if (!assignment) {
    return { error: "Not assigned to this task" };
  }

  try {
    const { signedUrl } = await generateLnLAudioForItem(taskId, itemId);
    return { signedUrl };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to generate audio",
    };
  }
}

export async function getAnnotation(taskId: string, itemId: string, userId: string) {
  const adminClient = getAdminClient();
  const { data } = await adminClient
    .from("lnl_annotations")
    .select("*")
    .eq("task_id", taskId)
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .eq("is_current", true)
    .single();

  return data;
}

export async function getTaskProgress(taskId: string, userId: string) {
  const adminClient = getAdminClient();

  const { count: total } = await adminClient
    .from("lnl_task_items")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId);

  const { count: completed } = await adminClient
    .from("lnl_annotations")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .eq("is_current", true)
    .in("status", ["completed", "reviewed"]);

  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("task_options")
    .eq("id", taskId)
    .single();

  const taskOptions = (task?.task_options ?? {}) as { randomized_order?: boolean };
  const randomized = taskOptions.randomized_order === true;

  const { data: lastAnnotation } = await adminClient
    .from("lnl_annotations")
    .select("item_id")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  let lastItemIndex: number | null = null;
  let lastDisplayIndex: number | null = null;

  if (lastAnnotation) {
    const { data: item } = await adminClient
      .from("lnl_task_items")
      .select("item_index")
      .eq("id", lastAnnotation.item_id)
      .single();
    const actualIndex = item?.item_index ?? null;
    lastItemIndex = actualIndex;

    if (randomized && actualIndex !== null && (total ?? 0) > 0) {
      const displayOrder = getDisplayOrder(taskId, userId, total ?? 0);
      lastDisplayIndex = itemIndexToDisplayIndex(actualIndex, displayOrder);
    } else {
      lastDisplayIndex = actualIndex;
    }
  }

  return {
    completed: completed ?? 0,
    total: total ?? 0,
    lastItemIndex,
    lastDisplayIndex: lastDisplayIndex ?? lastItemIndex,
  };
}

export async function saveAnnotation(data: {
  taskId: string;
  itemId: string;
  labels: unknown[];
  booleanAnswers: Record<string, unknown>;
  scores: Record<string, unknown>;
  overallComment: string;
  status: string;
  timeSpentMs: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const adminClient = getAdminClient();

  const { data: existing } = await adminClient
    .from("lnl_annotations")
    .select("id, version, labels, boolean_answers, scores, overall_comment, status")
    .eq("task_id", data.taskId)
    .eq("item_id", data.itemId)
    .eq("user_id", user.id)
    .eq("is_current", true)
    .single();

  if (existing) {
    await adminClient
      .from("lnl_annotations")
      .update({ is_current: false })
      .eq("id", existing.id);

    type LnlAnnotationInsert = Database["public"]["Tables"]["lnl_annotations"]["Insert"];
    const insertRow: LnlAnnotationInsert = {
      task_id: data.taskId,
      item_id: data.itemId,
      user_id: user.id,
      version: existing.version + 1,
      is_current: true,
      labels: data.labels as LnlAnnotationInsert["labels"],
      boolean_answers: data.booleanAnswers as LnlAnnotationInsert["boolean_answers"],
      scores: data.scores as LnlAnnotationInsert["scores"],
      overall_comment: data.overallComment,
      status: data.status,
      time_spent_ms: data.timeSpentMs,
      source: "manual",
    };

    const [historyResult, insertResult] = await Promise.all([
      adminClient.from("lnl_annotation_history").insert({
        annotation_id: existing.id,
        changed_by: user.id,
        previous_data: {
          id: existing.id,
          labels: existing.labels,
          boolean_answers: existing.boolean_answers,
          scores: existing.scores,
          overall_comment: existing.overall_comment,
          status: existing.status,
        },
        change_type: "updated",
      }),
      adminClient.from("lnl_annotations").insert(insertRow),
    ]);

    if (historyResult.error) return { error: historyResult.error.message };
    if (insertResult.error) return { error: insertResult.error.message };
  } else {
    type LnlAnnotationInsert = Database["public"]["Tables"]["lnl_annotations"]["Insert"];
    const insertRow: LnlAnnotationInsert = {
      task_id: data.taskId,
      item_id: data.itemId,
      user_id: user.id,
      version: 1,
      is_current: true,
      labels: data.labels as LnlAnnotationInsert["labels"],
      boolean_answers: data.booleanAnswers as LnlAnnotationInsert["boolean_answers"],
      scores: data.scores as LnlAnnotationInsert["scores"],
      overall_comment: data.overallComment,
      status: data.status,
      time_spent_ms: data.timeSpentMs,
      source: "manual",
    };
    const { error } = await adminClient.from("lnl_annotations").insert(insertRow);

    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function getTaskAssignmentRole(taskId: string, userId: string) {
  const adminClient = getAdminClient();
  const { data } = await adminClient
    .from("lnl_task_assignments")
    .select("role")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .single();

  return data?.role as "annotator" | "auditor" | null;
}

export async function getAnnotatorsForTask(taskId: string) {
  const adminClient = getAdminClient();
  const { data: assignments } = await adminClient
    .from("lnl_task_assignments")
    .select("user_id")
    .eq("task_id", taskId)
    .eq("role", "annotator");

  if (!assignments?.length) return [];

  const userIds = assignments.map((a: { user_id: string }) => a.user_id);
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  const emailMap = new Map((profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email]));

  return assignments.map((a: { user_id: string }) => ({
    userId: a.user_id,
    email: emailMap.get(a.user_id) ?? "Unknown",
  }));
}

export async function getAnnotationHistory(annotationId: string) {
  const adminClient = getAdminClient();
  const { data: history } = await adminClient
    .from("lnl_annotation_history")
    .select("id, changed_by, previous_data, change_type, change_description, created_at")
    .eq("annotation_id", annotationId)
    .order("created_at", { ascending: false });

  if (!history?.length) return [];

  const userIds = [...new Set(history.map((h: { changed_by: string }) => h.changed_by))];
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  const emailMap = new Map((profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email]));

  return history.map(
    (r: {
      id: string;
      changed_by: string;
      previous_data: unknown;
      change_type: string;
      change_description: string | null;
      created_at: string;
    }) => ({
      id: r.id,
      changedBy: r.changed_by,
      changedByEmail: emailMap.get(r.changed_by) ?? "Unknown",
      previousData: r.previous_data,
      changeType: r.change_type,
      changeDescription: r.change_description,
      createdAt: r.created_at,
    })
  );
}

export async function reopenAnnotation(annotationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const adminClient = getAdminClient();

  const { data: ann } = await adminClient
    .from("lnl_annotations")
    .select("id, task_id, item_id, user_id")
    .eq("id", annotationId)
    .eq("is_current", true)
    .single();

  if (!ann) return { error: "Annotation not found" };

  const { data: assignment } = await adminClient
    .from("lnl_task_assignments")
    .select("role")
    .eq("task_id", ann.task_id)
    .eq("user_id", user.id)
    .single();

  if (assignment?.role !== "auditor") {
    return { error: "Only auditors can reopen annotations" };
  }

  await adminClient
    .from("lnl_annotations")
    .update({ status: "in_progress" })
    .eq("id", annotationId);

  await adminClient.from("lnl_annotation_history").insert({
    annotation_id: annotationId,
    changed_by: user.id,
    previous_data: ann,
    change_type: "reopened",
    change_description: "Reopened for revision",
  });

  return { success: true };
}

export async function saveAnnotationAsReviewer(data: {
  taskId: string;
  itemId: string;
  annotatorUserId: string;
  labels: unknown[];
  booleanAnswers: Record<string, unknown>;
  scores: Record<string, unknown>;
  overallComment: string;
  status: string;
  timeSpentMs: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const adminClient = getAdminClient();

  const { data: assignment } = await adminClient
    .from("lnl_task_assignments")
    .select("role")
    .eq("task_id", data.taskId)
    .eq("user_id", user.id)
    .single();

  if (assignment?.role !== "auditor") {
    return { error: "Only auditors can save as reviewer" };
  }

  const { data: existing } = await adminClient
    .from("lnl_annotations")
    .select("id, version, labels, boolean_answers, scores, overall_comment, status")
    .eq("task_id", data.taskId)
    .eq("item_id", data.itemId)
    .eq("user_id", data.annotatorUserId)
    .eq("is_current", true)
    .single();

  if (!existing) return { error: "Annotation not found" };

  await adminClient
    .from("lnl_annotations")
    .update({ is_current: false })
    .eq("id", existing.id);

  type LnlAnnotationInsert = Database["public"]["Tables"]["lnl_annotations"]["Insert"];
  const insertRow: LnlAnnotationInsert = {
    task_id: data.taskId,
    item_id: data.itemId,
    user_id: data.annotatorUserId,
    version: existing.version + 1,
    is_current: true,
    labels: data.labels as LnlAnnotationInsert["labels"],
    boolean_answers: data.booleanAnswers as LnlAnnotationInsert["boolean_answers"],
    scores: data.scores as LnlAnnotationInsert["scores"],
    overall_comment: data.overallComment,
    status: data.status,
    time_spent_ms: data.timeSpentMs,
    source: "auto_reviewed",
  };

  const [historyResult, insertResult] = await Promise.all([
    adminClient.from("lnl_annotation_history").insert({
      annotation_id: existing.id,
      changed_by: user.id,
      previous_data: {
        id: existing.id,
        labels: existing.labels,
        boolean_answers: existing.boolean_answers,
        scores: existing.scores,
        overall_comment: existing.overall_comment,
        status: existing.status,
      },
      change_type: "reviewed",
      change_description: "Auditor review edit",
    }),
    adminClient.from("lnl_annotations").insert(insertRow),
  ]);

  if (historyResult.error) return { error: historyResult.error.message };
  if (insertResult.error) return { error: insertResult.error.message };
  return { success: true };
}
