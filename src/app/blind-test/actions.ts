"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { prepareNextRound } from "@/lib/matchmaking/engine";
import type { PrepareNextRoundResult } from "@/lib/matchmaking/engine";

export type LanguageOption = { id: string; name: string; code: string };

export async function getActiveLanguages(): Promise<LanguageOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("languages")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, code: r.code }));
}

export async function prepareNextRoundAction(
  languageId: string
): Promise<{ data?: PrepareNextRoundResult; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  try {
    const data = await prepareNextRound({ userId: user.id, languageId });
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to prepare round" };
  }
}

export async function submitVote(
  testEventId: string,
  winner: "A" | "B",
  listenTimeAMs: number,
  listenTimeBMs: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = getAdminClient();
  const { data: testEvent, error: fetchError } = await admin
    .from("test_events")
    .select("id, user_id, model_a_id, model_b_id, language_id, status")
    .eq("id", testEventId)
    .single();

  if (fetchError || !testEvent)
    return { error: "Test event not found" };
  if (testEvent.status !== "pending")
    return { error: "Test event already completed" };
  if (testEvent.user_id !== user.id)
    return { error: "Unauthorized" };

  const winnerId = winner === "A" ? testEvent.model_a_id : testEvent.model_b_id;
  const loserId = winner === "A" ? testEvent.model_b_id : testEvent.model_a_id;

  const { error: rpcError } = await admin.rpc("process_vote", {
    p_test_event_id: testEventId,
    p_winner_id: winnerId,
    p_loser_id: loserId,
    p_language_id: testEvent.language_id,
    p_listen_time_a_ms: listenTimeAMs,
    p_listen_time_b_ms: listenTimeBMs,
  });

  if (rpcError) return { error: rpcError.message };
  return {};
}

export async function markRoundInvalid(
  testEventId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = getAdminClient();
  const { data: testEvent, error: fetchError } = await admin
    .from("test_events")
    .select("id, user_id, status")
    .eq("id", testEventId)
    .single();

  if (fetchError || !testEvent)
    return { error: "Test event not found" };
  if (testEvent.user_id !== user.id)
    return { error: "Unauthorized" };

  const { error: updateError } = await admin
    .from("test_events")
    .update({ status: "invalid" })
    .eq("id", testEventId);

  if (updateError) return { error: updateError.message };
  console.warn("[BlindTest] Round marked invalid:", { testEventId, userId: user.id });
  return {};
}
