import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./page-client";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  try {
    const [
      totalRoundsRes,
      completedRoundsRes,
      testsPerDayData,
      latencyRes,
      errorRatesRes,
      matchupRes,
      activeModelsRes,
      activeUsersRes,
    ] = await Promise.all([
      admin.from("test_events").select("id", { count: "exact", head: true }),
      admin.from("test_events").select("id", { count: "exact", head: true }).eq("status", "completed"),
      admin
        .from("test_events")
        .select("voted_at")
        .eq("status", "completed")
        .not("voted_at", "is", null),
      getMedianLatencyByProvider(admin),
      getErrorRatesByProvider(admin),
      getMatchupDistribution(admin),
      admin.from("models").select("id", { count: "exact", head: true }).eq("is_active", true),
      admin.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const totalRounds = totalRoundsRes.count ?? 0;
    const completedRounds = completedRoundsRes.count ?? 0;
    const completionRate = totalRounds > 0 ? ((completedRounds / totalRounds) * 100).toFixed(1) : "0";
    const activeModels = activeModelsRes.count ?? 0;
    const activeUsers = activeUsersRes.count ?? 0;

    const byDay: Record<string, number> = {};
    for (const r of testsPerDayData.data ?? []) {
      const day = (r.voted_at as string).slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    const testsPerDay = Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30)
      .map(([day, count]) => ({ day, count }));

    return (
      <AnalyticsClient
        summary={{
          completedRounds,
          totalRounds,
          completionRate,
          activeModels,
          activeUsers,
        }}
        testsPerDay={testsPerDay}
        latency={latencyRes}
        errorRates={errorRatesRes}
        matchups={matchupRes}
      />
    );
  } catch {
    return (
      <div className="space-y-8">
        <h1 className="text-page-title">Analytics</h1>
        <p className="text-accent-red">Failed to load analytics.</p>
      </div>
    );
  }
}

async function getMedianLatencyByProvider(
  admin: ReturnType<typeof import("@/lib/supabase/admin").getAdminClient>
): Promise<{ provider: string; medianMs: number }[]> {
  const { data } = await admin
    .from("audio_files")
    .select("generation_latency_ms, model:models!inner(provider:providers!inner(name))");
  const byProvider: Record<string, number[]> = {};
  for (const r of data ?? []) {
    const prov = (r.model as { provider?: { name?: string } })?.provider?.name ?? "Unknown";
    const lat = (r as { generation_latency_ms: number | null }).generation_latency_ms;
    if (lat != null) {
      if (!byProvider[prov]) byProvider[prov] = [];
      byProvider[prov].push(lat);
    }
  }
  return Object.entries(byProvider).map(([provider, vals]) => {
    vals.sort((a, b) => a - b);
    const median = vals[Math.floor(vals.length / 2)] ?? 0;
    return { provider, medianMs: median };
  });
}

async function getErrorRatesByProvider(
  admin: ReturnType<typeof import("@/lib/supabase/admin").getAdminClient>
): Promise<{ provider: string; total: number; invalid: number; rate: number }[]> {
  const { data } = await admin
    .from("test_events")
    .select("status, model_a:models!model_a_id(provider:providers(name))");
  const byProvider: Record<string, { total: number; invalid: number }> = {};
  for (const r of data ?? []) {
    const prov = (r.model_a as { provider?: { name?: string } })?.provider?.name ?? "Unknown";
    if (!byProvider[prov]) byProvider[prov] = { total: 0, invalid: 0 };
    byProvider[prov].total++;
    if (r.status === "invalid") byProvider[prov].invalid++;
  }
  return Object.entries(byProvider).map(([provider, { total, invalid }]) => ({
    provider,
    total,
    invalid,
    rate: total > 0 ? (invalid / total) * 100 : 0,
  }));
}

async function getMatchupDistribution(
  admin: ReturnType<typeof import("@/lib/supabase/admin").getAdminClient>
): Promise<{ modelA: string; modelB: string; matches: number; aWins: number; bWins: number }[]> {
  const { data } = await admin
    .from("test_events")
    .select("model_a_id, model_b_id, winner_id, model_a:models!model_a_id(name), model_b:models!model_b_id(name)")
    .eq("status", "completed");
  const map = new Map<string, { aWins: number; bWins: number }>();
  for (const r of data ?? []) {
    const key = [r.model_a_id, r.model_b_id].sort().join("|");
    const aWon = r.winner_id === r.model_a_id ? 1 : 0;
    const bWon = r.winner_id === r.model_b_id ? 1 : 0;
    const prev = map.get(key) ?? { aWins: 0, bWins: 0 };
    map.set(key, { aWins: prev.aWins + aWon, bWins: prev.bWins + bWon });
  }
  const modelNames = new Map<string, string>();
  for (const r of data ?? []) {
    const ma = r.model_a as { id?: string; name?: string };
    const mb = r.model_b as { id?: string; name?: string };
    if (ma?.id) modelNames.set(ma.id, ma.name ?? "Unknown");
    if (mb?.id) modelNames.set(mb.id, mb.name ?? "Unknown");
  }
  return Array.from(map.entries())
    .map(([key, { aWins, bWins }]) => {
      const [idA, idB] = key.split("|");
      return {
        modelA: modelNames.get(idA!) ?? idA!,
        modelB: modelNames.get(idB!) ?? idB!,
        matches: aWins + bWins,
        aWins,
        bWins,
      };
    })
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 50);
}
