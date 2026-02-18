"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { prepareNextRound } from "@/lib/matchmaking/engine";
import type { PrepareNextRoundResult } from "@/lib/matchmaking/engine";
import { logger } from "@/lib/logger";

export type LanguageOption = { id: string; name: string; code: string };

export async function getCompletedRoundsCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const admin = getAdminClient();
  const { count, error } = await admin
    .from("test_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["completed", "invalid"]);

  if (error) return 0;
  return count ?? 0;
}

export async function getActiveLanguages(): Promise<LanguageOption[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("languages")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, code: r.code }));
}

export async function prepareNextRoundAction(
  languageId: string
): Promise<{ data?: PrepareNextRoundResult; error?: string; debug?: object }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  try {
    const data = await prepareNextRound({ userId: user.id, languageId });
    return { data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to prepare round";
    return { error: errorMessage };
  }
}

const VOTE_RATE_LIMIT = 10;
const VOTE_RATE_WINDOW_SEC = 60;
const MIN_LISTEN_MS = 3000;

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

  if (listenTimeAMs <= 0 || listenTimeBMs <= 0) {
    return { error: "Invalid listen times" };
  }
  if (listenTimeAMs < MIN_LISTEN_MS || listenTimeBMs < MIN_LISTEN_MS) {
    logger.warn("Short listen time", {
      testEventId,
      userId: user.id,
      listenTimeAMs,
      listenTimeBMs,
    });
  }

  const admin = getAdminClient();

  const windowStart = new Date(Date.now() - VOTE_RATE_WINDOW_SEC * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("test_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("voted_at", windowStart);

  if (countError) return { error: "Rate limit check failed" };
  if ((count ?? 0) >= VOTE_RATE_LIMIT) {
    logger.warn("Vote rate limit exceeded", { userId: user.id, count });
    return { error: "Too many votes. Please slow down." };
  }
  const { data: testEvent, error: fetchError } = await admin
    .from("test_events")
    .select("id, user_id, model_a_id, model_b_id, language_id, status, test_type")
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

  const listenA = Math.floor(listenTimeAMs);
  const listenB = Math.floor(listenTimeBMs);

  const testType = (testEvent as { test_type?: string }).test_type ?? "blind";

  if (testType === "custom") {
    const { error: updateError } = await admin
      .from("test_events")
      .update({
        winner_id: winnerId,
        loser_id: loserId,
        listen_time_a_ms: listenA,
        listen_time_b_ms: listenB,
        status: "completed",
        voted_at: new Date().toISOString(),
      })
      .eq("id", testEventId);

    if (updateError) return { error: updateError.message };
  } else {
    const { error: rpcError } = await admin.rpc("process_vote", {
      p_test_event_id: testEventId,
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_language_id: testEvent.language_id,
      p_listen_time_a_ms: listenA,
      p_listen_time_b_ms: listenB,
    });

    if (rpcError) return { error: rpcError.message };
  }
  logger.info("Vote submitted", {
    testEventId,
    userId: user.id,
    winner,
    listenTimeAMs,
    listenTimeBMs,
  });
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
  logger.warn("Round marked invalid", { testEventId, userId: user.id });
  return {};
}
