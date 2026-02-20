"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import {
  getDisplayOrder,
  itemIndexToDisplayIndex,
} from "@/lib/lnl/display-order";

export interface AssignedTaskWithProgress {
  id: string;
  name: string;
  description: string | null;
  tool_type: string;
  status: string;
  completed: number;
  total: number;
  lastDisplayIndex: number | null;
  lastItemIndex: number | null;
}

export async function getAssignedTasksForUser(userId: string) {
  const adminClient = getAdminClient();

  const { data: assignments } = await adminClient
    .from("lnl_task_assignments")
    .select("task_id")
    .eq("user_id", userId);

  if (!assignments?.length) return [];

  const taskIds = assignments.map((a) => a.task_id);

  const { data: tasks } = await adminClient
    .from("lnl_tasks")
    .select("id, name, description, tool_type, status")
    .in("id", taskIds)
    .in("status", ["active", "paused", "completed"]);

  const result: AssignedTaskWithProgress[] = [];

  for (const task of tasks ?? []) {
    const { count: total } = await adminClient
      .from("lnl_task_items")
      .select("*", { count: "exact", head: true })
      .eq("task_id", task.id);

    const { count: completed } = await adminClient
      .from("lnl_annotations")
      .select("*", { count: "exact", head: true })
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .eq("is_current", true)
      .in("status", ["completed", "reviewed"]);

    const totalCount = total ?? 0;
    const displayOrder =
      totalCount > 0
        ? getDisplayOrder(task.id, userId, totalCount)
        : [];

    const { data: lastAnn } = await adminClient
      .from("lnl_annotations")
      .select("item_id")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .eq("is_current", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    let lastItemIndex: number | null = null;
    let lastDisplayIndex: number | null = null;
    if (lastAnn && displayOrder.length > 0) {
      const { data: item } = await adminClient
        .from("lnl_task_items")
        .select("item_index")
        .eq("id", lastAnn.item_id)
        .single();
      lastItemIndex = item?.item_index ?? null;
      if (lastItemIndex != null) {
        lastDisplayIndex = itemIndexToDisplayIndex(
          lastItemIndex,
          displayOrder
        );
      }
    }

    result.push({
      id: task.id,
      name: task.name,
      description: task.description,
      tool_type: task.tool_type,
      status: task.status,
      completed: completed ?? 0,
      total: total ?? 0,
      lastDisplayIndex,
      lastItemIndex,
    });
  }

  result.sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return 0;
  });

  return result;
}
