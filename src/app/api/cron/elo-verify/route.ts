/**
 * Cron endpoint for ELO rating verification (PRD 10).
 * Configure in vercel.json: "crons": [{ "path": "/api/cron/elo-verify", "schedule": "0 3 * * *" }]
 * Or call manually with CRON_SECRET header for auth.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { calculateEloUpdate } from "@/lib/elo/calculator";

export const maxDuration = 300; // 5 min for Vercel Pro

const INITIAL = { rating: 1500, matches_played: 0, wins: 0, losses: 0 };

function getOrInit(
  map: Map<string, { rating: number; matches_played: number; wins: number; losses: number }>,
  key: string,
  init: () => { rating: number; matches_played: number; wins: number; losses: number }
) {
  let v = map.get(key);
  if (!v) {
    v = init();
    map.set(key, v);
  }
  return v;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = getAdminClient();
    const { data: events, error } = await admin
      .from("test_events")
      .select("id, winner_id, loser_id, language_id, created_at")
      .eq("status", "completed")
      .not("winner_id", "is", null)
      .not("loser_id", "is", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[ELO verify] Failed to fetch test_events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[ELO verify] Fetched ${events?.length ?? 0} completed events`);

    // Build model_id -> (provider_id, model_id) lookup
    const modelIds = new Set<string>();
    for (const ev of events ?? []) {
      modelIds.add(ev.winner_id as string);
      modelIds.add(ev.loser_id as string);
    }
    const { data: models } = await admin
      .from("models")
      .select("id, provider_id, model_id")
      .in("id", Array.from(modelIds));
    const modelToKey = new Map(
      (models ?? []).map((m) => [m.id, `${m.provider_id}:${m.model_id}`])
    );

    // Replay events at model level; skip same-model pairs
    const globalState = new Map<string, { rating: number; matches_played: number; wins: number; losses: number }>();
    const langState = new Map<string, { rating: number; matches_played: number; wins: number; losses: number }>();

    for (const ev of events ?? []) {
      const winnerKey = modelToKey.get(ev.winner_id as string);
      const loserKey = modelToKey.get(ev.loser_id as string);
      const langId = ev.language_id as string;

      if (!winnerKey || !loserKey) continue;
      if (winnerKey === loserKey) continue; // skip same-model pairs

      const wGlobal = getOrInit(globalState, winnerKey, () => ({ ...INITIAL }));
      const lGlobal = getOrInit(globalState, loserKey, () => ({ ...INITIAL }));
      const wLang = getOrInit(langState, `${winnerKey}:${langId}`, () => ({ ...INITIAL }));
      const lLang = getOrInit(langState, `${loserKey}:${langId}`, () => ({ ...INITIAL }));

      const globalResult = calculateEloUpdate({
        winnerRating: wGlobal.rating,
        loserRating: lGlobal.rating,
        winnerMatchesPlayed: wGlobal.matches_played,
        loserMatchesPlayed: lGlobal.matches_played,
      });
      const langResult = calculateEloUpdate({
        winnerRating: wLang.rating,
        loserRating: lLang.rating,
        winnerMatchesPlayed: wLang.matches_played,
        loserMatchesPlayed: lLang.matches_played,
      });

      wGlobal.rating = globalResult.winnerNewRating;
      wGlobal.matches_played += 1;
      wGlobal.wins += 1;
      lGlobal.rating = globalResult.loserNewRating;
      lGlobal.matches_played += 1;
      lGlobal.losses += 1;

      wLang.rating = langResult.winnerNewRating;
      wLang.matches_played += 1;
      wLang.wins += 1;
      lLang.rating = langResult.loserNewRating;
      lLang.matches_played += 1;
      lLang.losses += 1;
    }

    // Fetch stored model-level ratings for comparison
    const { data: storedGlobal } = await admin
      .from("elo_ratings_global_model")
      .select("provider_id, model_id, rating, matches_played, wins, losses");
    const { data: storedLang } = await admin
      .from("elo_ratings_by_language_model")
      .select("provider_id, model_id, language_id, rating, matches_played, wins, losses");

    const storedGlobalMap = new Map(
      (storedGlobal ?? []).map((r) => [`${r.provider_id}:${r.model_id}`, { rating: r.rating, matches_played: r.matches_played, wins: r.wins, losses: r.losses }])
    );
    const storedLangMap = new Map(
      (storedLang ?? []).map((r) => [`${r.provider_id}:${r.model_id}:${r.language_id}`, { rating: r.rating, matches_played: r.matches_played, wins: r.wins, losses: r.losses }])
    );

    const RATING_TOLERANCE = 1;
    let ratingDiscrepancies = 0;
    let statsDiscrepancies = 0;

    for (const [modelKey, recomputed] of globalState) {
      const stored = storedGlobalMap.get(modelKey);
      if (!stored) continue;
      const ratingDiff = Math.abs(recomputed.rating - stored.rating);
      if (ratingDiff > RATING_TOLERANCE) {
        console.warn(`[ELO verify] Global rating discrepancy ${modelKey}: recomputed=${recomputed.rating.toFixed(2)} stored=${stored.rating} diff=${ratingDiff.toFixed(2)}`);
        ratingDiscrepancies++;
      }
      if (recomputed.matches_played !== stored.matches_played || recomputed.wins !== stored.wins || recomputed.losses !== stored.losses) {
        console.warn(`[ELO verify] Global stats discrepancy ${modelKey}: recomputed(matches=${recomputed.matches_played}, wins=${recomputed.wins}, losses=${recomputed.losses}) stored(matches=${stored.matches_played}, wins=${stored.wins}, losses=${stored.losses})`);
        statsDiscrepancies++;
      }
    }

    for (const [key, recomputed] of langState) {
      const stored = storedLangMap.get(key);
      if (!stored) continue;
      const ratingDiff = Math.abs(recomputed.rating - stored.rating);
      if (ratingDiff > RATING_TOLERANCE) {
        console.warn(`[ELO verify] Per-language rating discrepancy ${key}: recomputed=${recomputed.rating.toFixed(2)} stored=${stored.rating} diff=${ratingDiff.toFixed(2)}`);
        ratingDiscrepancies++;
      }
      if (recomputed.matches_played !== stored.matches_played || recomputed.wins !== stored.wins || recomputed.losses !== stored.losses) {
        console.warn(`[ELO verify] Per-language stats discrepancy ${key}: recomputed(matches=${recomputed.matches_played}, wins=${recomputed.wins}, losses=${recomputed.losses}) stored(matches=${stored.matches_played}, wins=${stored.wins}, losses=${stored.losses})`);
        statsDiscrepancies++;
      }
    }

    if (ratingDiscrepancies > 0) {
      console.warn(`[ELO verify] Found ${ratingDiscrepancies} rating discrepancy(ies)`);
    }
    if (statsDiscrepancies > 0) {
      console.warn(`[ELO verify] Found ${statsDiscrepancies} stats discrepancy(ies)`);
    }

    return NextResponse.json({
      ok: true,
      eventsCount: events?.length ?? 0,
      modelsChecked: globalState.size,
      ratingDiscrepancies,
      statsDiscrepancies,
    });
  } catch (err) {
    console.error("[ELO verify cron failed]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ELO verification failed" },
      { status: 500 }
    );
  }
}
