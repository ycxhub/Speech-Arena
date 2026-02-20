import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isLnlAdmin } from "@/lib/lnl/roles";
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

  const body = await request.json();
  const { text, audio_url, ipa, normalized_text, metadata, word_timestamps } =
    body;

  if (!text || !audio_url) {
    return NextResponse.json(
      { error: "text and audio_url are required" },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();

  const { count } = await adminClient
    .from("lnl_task_items")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId);

  const itemIndex = (count ?? 0) + 1;

  const { data: item, error } = await adminClient
    .from("lnl_task_items")
    .insert({
      task_id: taskId,
      item_index: itemIndex,
      audio_url,
      text,
      ipa_text: ipa || null,
      normalized_text: normalized_text || null,
      metadata: metadata || {},
      word_timestamps: word_timestamps || null,
    })
    .select("id, item_index")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}
