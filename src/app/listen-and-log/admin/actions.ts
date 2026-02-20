"use server";

import { getAdminClient } from "@/lib/supabase/admin";

export interface RecentActivityItem {
  id: string;
  task_id: string;
  task_name: string;
  item_index: number;
  user_email: string | null;
  change_type: string;
  created_at: string;
}

export async function getAdminDashboardStats() {
  const admin = getAdminClient();

  const [tasksRes, usersRes, annotationsRes, historyRes] = await Promise.all([
    admin.from("lnl_tasks").select("id, status", { count: "exact", head: true }),
    admin.from("lnl_user_roles").select("id", { count: "exact", head: true }),
    admin
      .from("lnl_annotations")
      .select("id", { count: "exact", head: true })
      .eq("is_current", true),
    admin
      .from("lnl_annotation_history")
      .select("id, annotation_id, change_type, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const tasksCount = tasksRes.count ?? 0;
  const usersCount = usersRes.count ?? 0;
  const annotationsCount = annotationsRes.count ?? 0;

  const history = historyRes.data ?? [];
  const annotationIds = [...new Set(history.map((h) => h.annotation_id))];

  const activity: RecentActivityItem[] = [];

  if (annotationIds.length > 0) {
    const { data: annotations } = await admin
      .from("lnl_annotations")
      .select("id, task_id, item_id, user_id")
      .in("id", annotationIds);

    const taskIds = [...new Set((annotations ?? []).map((a) => a.task_id))];
    const itemIds = [...new Set((annotations ?? []).map((a) => a.item_id))];

    const [tasksData, itemsData] = await Promise.all([
      admin.from("lnl_tasks").select("id, name").in("id", taskIds),
      admin.from("lnl_task_items").select("id, item_index").in("id", itemIds),
    ]);

    const tasksMap = new Map(
      (tasksData.data ?? []).map((t) => [t.id, t.name])
    );
    const itemsMap = new Map(
      (itemsData.data ?? []).map((i) => [i.id, i.item_index])
    );
    const annMap = new Map((annotations ?? []).map((a) => [a.id, a]));
    const uniqueUserIds = [...new Set((annotations ?? []).map((a) => a.user_id))];
    const usersMap = new Map<string, string>();
    for (const uid of uniqueUserIds) {
      const { data } = await admin.auth.admin.getUserById(uid);
      usersMap.set(uid, data?.user?.email ?? "");
    }

    for (const h of history) {
      const ann = annMap.get(h.annotation_id);
      if (!ann) continue;
      activity.push({
        id: h.id,
        task_id: ann.task_id,
        task_name: tasksMap.get(ann.task_id) ?? "Unknown",
        item_index: itemsMap.get(ann.item_id) ?? 0,
        user_email: usersMap.get(ann.user_id) || null,
        change_type: h.change_type,
        created_at: h.created_at,
      });
    }
  }

  return {
    tasksCount,
    usersCount,
    annotationsCount,
    recentActivity: activity,
  };
}
