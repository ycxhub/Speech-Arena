"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

export interface TaskFormData {
  name: string;
  description?: string;
  tool_type: string;
  label_config: Record<string, unknown>;
  task_options: Record<string, unknown>;
  status?: string;
}

export async function createTask(data: TaskFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  const insertRow: Database["public"]["Tables"]["lnl_tasks"]["Insert"] = {
    name: data.name,
    description: data.description ?? "",
    tool_type: data.tool_type,
    label_config: data.label_config as Database["public"]["Tables"]["lnl_tasks"]["Row"]["label_config"],
    task_options: data.task_options as Database["public"]["Tables"]["lnl_tasks"]["Row"]["task_options"],
    status: data.status ?? "draft",
    created_by: user.id,
  };
  const { data: task, error } = await adminClient
    .from("lnl_tasks")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/tasks");
  return { success: true, taskId: task.id };
}

export async function updateTask(taskId: string, data: Partial<TaskFormData>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  type LnlTaskUpdate = Database["public"]["Tables"]["lnl_tasks"]["Update"];
  const updateRow: LnlTaskUpdate = {
    updated_at: new Date().toISOString(),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.tool_type !== undefined && { tool_type: data.tool_type }),
    ...(data.label_config !== undefined && {
      label_config: data.label_config as LnlTaskUpdate["label_config"],
    }),
    ...(data.task_options !== undefined && {
      task_options: data.task_options as LnlTaskUpdate["task_options"],
    }),
    ...(data.status !== undefined && { status: data.status }),
  };
  const { error } = await adminClient.from("lnl_tasks").update(updateRow).eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/tasks");
  revalidatePath(`/listen-and-log/admin/tasks/${taskId}`);
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const validStatuses = ["draft", "active", "paused", "completed", "archived"];
  if (!validStatuses.includes(status)) return { error: "Invalid status" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/tasks");
  revalidatePath(`/listen-and-log/admin/tasks/${taskId}`);
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_tasks")
    .delete()
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/tasks");
  return { success: true };
}

async function ensureUserHasLnlRole(
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string,
  _role: string
) {
  const { data: existing } = await adminClient
    .from("lnl_user_roles")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (existing) return;

  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  let invitedBy: string | null = null;
  let lnlRole = "lnl_annotator";

  if (email) {
    const { data: invs } = await adminClient
      .from("lnl_invitations")
      .select("id, email, invited_by, role")
      .eq("status", "pending");
    const inv = (invs ?? []).find(
      (i) => i.email?.toLowerCase() === email.toLowerCase()
    );
    if (inv) {
      invitedBy = inv.invited_by;
      lnlRole = inv.role;
      await adminClient
        .from("lnl_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", inv.id);
    }
  }

  await adminClient.from("lnl_user_roles").upsert(
    {
      user_id: userId,
      role: lnlRole,
      invited_by: invitedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function assignUsersToTask(
  taskId: string,
  assignments: Array<{ userId: string; role: string }>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();

  for (const a of assignments) {
    await ensureUserHasLnlRole(adminClient, a.userId, a.role);
  }

  const { error: deleteError } = await adminClient
    .from("lnl_task_assignments")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) return { error: deleteError.message };

  if (assignments.length > 0) {
    const rows = assignments.map((a) => ({
      task_id: taskId,
      user_id: a.userId,
      role: a.role,
      assigned_by: user.id,
    }));

    const { error } = await adminClient
      .from("lnl_task_assignments")
      .insert(rows);

    if (error) return { error: error.message };
  }

  revalidatePath(`/listen-and-log/admin/tasks/${taskId}`);
  return { success: true };
}

export async function removeUserFromTask(taskId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_task_assignments")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/listen-and-log/admin/tasks/${taskId}`);
  return { success: true };
}

export interface CreateTaskFromBlindTestsParams {
  modelIds: string[];
  outcome: "lost" | "won";
  taskName: string;
  taskDescription?: string;
}

export async function createTaskFromBlindTests(params: CreateTaskFromBlindTestsParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const { modelIds, outcome, taskName, taskDescription } = params;
  if (modelIds.length === 0) {
    return { error: "At least one model must be selected" };
  }

  const adminClient = getAdminClient();

  // Query test_events where Falcon lost or won, with audio and sentence data
  const outcomeColumn = outcome === "lost" ? "loser_id" : "winner_id";
  const { data: events, error: eventsErr } = await adminClient
    .from("test_events")
    .select(
      `
      id,
      sentence_id,
      model_a_id,
      model_b_id,
      audio_a_id,
      audio_b_id,
      winner_id,
      loser_id,
      voted_at
    `
    )
    .eq("status", "completed")
    .in(outcomeColumn, modelIds)
    .not("voted_at", "is", null)
    .order("voted_at", { ascending: true });

  if (eventsErr) return { error: eventsErr.message };
  if (!events || events.length === 0) {
    return { error: "No blind tests found for this model/outcome." };
  }

  // Build map: sentence_id -> { r2_key, text } (deduplicate by sentence_id, keep first by voted_at)
  const seenSentenceIds = new Set<string>();
  const itemsToInsert: Array<{ sentence_id: string; audio_file_id: string }> = [];

  for (const ev of events) {
    if (!ev.sentence_id || seenSentenceIds.has(ev.sentence_id)) continue;
    seenSentenceIds.add(ev.sentence_id);

    const falconModelId = outcome === "lost" ? ev.loser_id : ev.winner_id;
    if (!falconModelId || !modelIds.includes(falconModelId)) continue;

    const isFalconA = ev.model_a_id === falconModelId;
    const audioFileId = isFalconA ? ev.audio_a_id : ev.audio_b_id;
    if (!audioFileId) continue;

    itemsToInsert.push({ sentence_id: ev.sentence_id, audio_file_id: audioFileId });
  }

  if (itemsToInsert.length === 0) {
    return { error: "No unique items to import after deduplication." };
  }

  // Fetch audio_files r2_key and sentences text
  const audioIds = [...new Set(itemsToInsert.map((i) => i.audio_file_id))];
  const sentenceIds = [...new Set(itemsToInsert.map((i) => i.sentence_id))];

  const { data: audioFiles, error: afErr } = await adminClient
    .from("audio_files")
    .select("id, r2_key")
    .in("id", audioIds);

  if (afErr) return { error: afErr.message };
  const audioMap = new Map((audioFiles ?? []).map((a) => [a.id, a.r2_key]));

  const { data: sentences, error: sErr } = await adminClient
    .from("sentences")
    .select("id, text")
    .in("id", sentenceIds);

  if (sErr) return { error: sErr.message };
  const sentenceMap = new Map((sentences ?? []).map((s) => [s.id, s.text]));

  // Create task with default label config (text_annotation requires at least one label)
  const defaultLabelConfig = {
    labels: [
      { name: "Good", color: "#22c55e", description: "Acceptable quality", shortcut_key: "1" },
      { name: "Issue", color: "#ef4444", description: "Needs review", shortcut_key: "2" },
    ],
  };

  const defaultTaskOptions = {
    randomized_order: false,
    transcript_visibility: "shown",
    show_ipa: false,
    show_normalized_text: false,
    per_label_comments: true,
    overall_comment: true,
    boolean_questions: [] as string[],
    scoring_fields: [] as Array<{ name: string; min: number; max: number; description: string }>,
  };

  const insertRow: Database["public"]["Tables"]["lnl_tasks"]["Insert"] = {
    name: taskName,
    description: taskDescription ?? "",
    tool_type: "text_annotation",
    label_config: defaultLabelConfig as Database["public"]["Tables"]["lnl_tasks"]["Row"]["label_config"],
    task_options: defaultTaskOptions as Database["public"]["Tables"]["lnl_tasks"]["Row"]["task_options"],
    status: "draft",
    created_by: user.id,
  };

  const { data: task, error: taskErr } = await adminClient
    .from("lnl_tasks")
    .insert(insertRow)
    .select("id")
    .single();

  if (taskErr) return { error: taskErr.message };
  if (!task) return { error: "Failed to create task" };

  // Bulk insert lnl_task_items
  const itemRows = itemsToInsert.map((item, idx) => {
    const r2Key = audioMap.get(item.audio_file_id);
    const text = sentenceMap.get(item.sentence_id);
    if (!r2Key || !text) return null;
    return {
      task_id: task.id,
      item_index: idx + 1,
      audio_url: r2Key,
      text,
      metadata: {},
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const { error: insertErr } = await adminClient
    .from("lnl_task_items")
    .insert(itemRows);

  if (insertErr) return { error: insertErr.message };

  revalidatePath("/listen-and-log/admin/tasks");
  revalidatePath(`/listen-and-log/admin/tasks/${task.id}`);
  return { success: true, taskId: task.id, itemsCreated: itemRows.length };
}

export async function getMurfFalconModels() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized", data: [] };

  const adminClient = getAdminClient();

  // Murf AI provider: match by name containing "murf" (covers "Murf AI", "Murf", etc.)
  const { data: murfProviders, error: provErr } = await adminClient
    .from("providers")
    .select("id")
    .ilike("name", "%murf%")
    .eq("is_active", true)
    .limit(1);

  if (provErr || !murfProviders?.length) {
    return { error: "Murf AI provider not found. Add a provider named 'Murf AI' with FALCON model(s) in Admin → Providers.", data: [] };
  }

  const murfProvider = murfProviders[0];

  const { data: models, error } = await adminClient
    .from("models")
    .select("id, name, model_id")
    .eq("provider_id", murfProvider.id)
    .eq("is_active", true)
    .ilike("model_id", "%FALCON%");

  if (error) return { error: error.message, data: [] };

  return {
    data: (models ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      model_id: m.model_id,
    })),
  };
}

export async function getTasks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  const adminClient = getAdminClient();
  const { data: tasks, error } = await adminClient
    .from("lnl_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };

  const taskIds = (tasks ?? []).map((t) => t.id);

  let itemCounts: Record<string, number> = {};
  let assignmentCounts: Record<string, number> = {};

  if (taskIds.length > 0) {
    const { data: items } = await adminClient
      .from("lnl_task_items")
      .select("task_id")
      .in("task_id", taskIds);

    itemCounts = (items ?? []).reduce(
      (acc, item) => {
        acc[item.task_id] = (acc[item.task_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const { data: assignments } = await adminClient
      .from("lnl_task_assignments")
      .select("task_id")
      .in("task_id", taskIds);

    assignmentCounts = (assignments ?? []).reduce(
      (acc, a) => {
        acc[a.task_id] = (acc[a.task_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  const enrichedTasks = (tasks ?? []).map((t) => ({
    ...t,
    item_count: itemCounts[t.id] || 0,
    user_count: assignmentCounts[t.id] || 0,
  }));

  return { data: enrichedTasks };
}
