/**
 * Cron endpoint for abuse detection (PRD 14).
 * Flags users with suspicious vote patterns.
 * Configure in vercel.json. Call with CRON_SECRET header for auth.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = getAdminClient();

    const { data: adminUser } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    const systemAdminId = adminUser?.id;
    if (!systemAdminId) {
      logger.warn("Abuse check: no admin user found, skipping audit log inserts");
    }

    const { data: events } = await admin
      .from("test_events")
      .select("user_id, winner_id, model_a_id, model_b_id, listen_time_a_ms, listen_time_b_ms, voted_at")
      .eq("status", "completed")
      .not("winner_id", "is", null);

    const byUser = new Map<
      string,
      { total: number; shortListen: number; voteA: number; voteB: number; votesByHour: Map<number, number> }
    >();

    for (const e of events ?? []) {
      const uid = e.user_id as string;
      if (!byUser.has(uid)) {
        byUser.set(uid, { total: 0, shortListen: 0, voteA: 0, voteB: 0, votesByHour: new Map() });
      }
      const u = byUser.get(uid)!;
      u.total++;
      const listenA = (e.listen_time_a_ms as number) ?? 0;
      const listenB = (e.listen_time_b_ms as number) ?? 0;
      if (listenA < 3000 || listenB < 3000) u.shortListen++;
      const winner = e.winner_id as string;
      if (winner === e.model_a_id) u.voteA++;
      else u.voteB++;
      const votedAt = new Date((e.voted_at as string) ?? 0).getTime();
      const hour = Math.floor(votedAt / 3600000);
      u.votesByHour.set(hour, (u.votesByHour.get(hour) ?? 0) + 1);
    }

    let flagsInserted = 0;

    for (const [userId, stats] of byUser) {
      const reasons: string[] = [];
      if (stats.total >= 50 && stats.shortListen / stats.total > 0.5) {
        reasons.push(">50% votes with listen_time<3000ms");
      }
      const maxPerHour = stats.votesByHour.size > 0 ? Math.max(...stats.votesByHour.values()) : 0;
      if (maxPerHour > 100) {
        reasons.push(`>100 votes per hour (max=${maxPerHour})`);
      }
      if (stats.total >= 50) {
        const aPct = stats.voteA / stats.total;
        const bPct = stats.voteB / stats.total;
        if (aPct > 0.9 || bPct > 0.9) {
          reasons.push(">90% same position (A or B)");
        }
      }
      if (reasons.length > 0 && systemAdminId) {
        await admin.from("admin_audit_log").insert({
          admin_id: systemAdminId,
          action: "abuse_flag",
          entity_type: "user",
          entity_id: userId,
          details: { reasons, total: stats.total, shortListen: stats.shortListen },
        });
        flagsInserted++;
        logger.warn("Abuse flag inserted", { userId, reasons });
      }
    }

    return NextResponse.json({ ok: true, usersChecked: byUser.size, flagsInserted });
  } catch (err) {
    logger.error("Abuse check cron failed", { error: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Abuse check failed" },
      { status: 500 }
    );
  }
}
