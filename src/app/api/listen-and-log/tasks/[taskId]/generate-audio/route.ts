import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { generateLnLAudioForItem } from "@/lib/lnl/tts-generate";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
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

  let batchSize = 5;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.batchSize === "number" && body.batchSize > 0) {
      batchSize = Math.min(body.batchSize, 20);
    }
  } catch {
    // use default
  }

  const adminClient = getAdminClient();

  // Find items with null audio_url
  const { data: items, error: itemsErr } = await adminClient
    .from("lnl_task_items")
    .select("id")
    .eq("task_id", taskId)
    .is("audio_url", null)
    .limit(batchSize)
    .order("item_index", { ascending: true });

  if (itemsErr) {
    return NextResponse.json(
      { error: itemsErr.message },
      { status: 500 }
    );
  }

  if (!items || items.length === 0) {
    const { count } = await adminClient
      .from("lnl_task_items")
      .select("*", { count: "exact", head: true })
      .eq("task_id", taskId);
    return NextResponse.json({
      generated: 0,
      remaining: 0,
      total: count ?? 0,
    });
  }

  let generated = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      await generateLnLAudioForItem(taskId, item.id);
      generated++;
    } catch (err) {
      errors.push(
        `Item ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const { count: remainingCount } = await adminClient
    .from("lnl_task_items")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId)
    .is("audio_url", null);

  const { count: totalCount } = await adminClient
    .from("lnl_task_items")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId);

  return NextResponse.json({
    generated,
    remaining: remainingCount ?? 0,
    total: totalCount ?? 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}
