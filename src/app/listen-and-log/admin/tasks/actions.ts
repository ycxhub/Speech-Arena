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
