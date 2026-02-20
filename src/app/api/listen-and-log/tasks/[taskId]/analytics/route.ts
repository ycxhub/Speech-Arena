import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const adminClient = getAdminClient();

  const { count: totalItems } = await adminClient
    .from("lnl_task_items")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId);

  const { data: annotations } = await adminClient
    .from("lnl_annotations")
    .select("user_id, status, time_spent_ms, labels")
    .eq("task_id", taskId)
    .eq("is_current", true);

  const completedCount =
    annotations?.filter((a) =>
      ["completed", "reviewed"].includes(a.status)
    ).length ?? 0;

  const flaggedCount =
    annotations?.filter((a) => a.status === "flagged").length ?? 0;

  const total = totalItems ?? 0;
  const completionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const userIds = [...new Set((annotations ?? []).map((a) => a.user_id))];
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

  const perAnnotator: Array<{
    userId: string;
    email: string;
    completed: number;
    total: number;
  }> = [];
  for (const uid of userIds) {
    const userAnnotations = annotations?.filter((a) => a.user_id === uid) ?? [];
    const completed = userAnnotations.filter((a) =>
      ["completed", "reviewed"].includes(a.status)
    ).length;
    perAnnotator.push({
      userId: uid,
      email: emailMap.get(uid) ?? "Unknown",
      completed,
      total,
    });
  }

  const labelDistribution: Record<string, number> = {};
  for (const a of annotations ?? []) {
    const labels = (a.labels as Array<{ label_name: string }>) ?? [];
    for (const l of labels) {
      const name = l.label_name ?? "Unknown";
      labelDistribution[name] = (labelDistribution[name] ?? 0) + 1;
    }
  }

  const times = (annotations ?? [])
    .map((a) => a.time_spent_ms)
    .filter((t): t is number => t != null && t > 0);
  const avgTimePerItem =
    times.length > 0
      ? Math.round(times.reduce((s, t) => s + t, 0) / times.length)
      : 0;

  return NextResponse.json({
    totalItems: total,
    completedItems: completedCount,
    completionPercentage: completionPct,
    perAnnotatorProgress: perAnnotator,
    labelDistribution,
    averageTimePerItemMs: avgTimePerItem,
    flaggedItemsCount: flaggedCount,
  });
}
