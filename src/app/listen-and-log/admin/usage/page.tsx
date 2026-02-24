import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlTable } from "@/components/lnl/ui/lnl-table";

export default async function UsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const adminClient = getAdminClient();

  const { data: generations } = await adminClient
    .from("lnl_tts_generations")
    .select("id, task_id, characters_generated, estimated_cost_usd, created_at")
    .order("created_at", { ascending: false });

  const taskIds = [...new Set((generations ?? []).map((g) => g.task_id))];
  const { data: tasks } =
    taskIds.length > 0
      ? await adminClient
          .from("lnl_tasks")
          .select("id, name")
          .in("id", taskIds)
      : { data: [] };
  const taskNameMap = new Map((tasks ?? []).map((t) => [t.id, t.name]));

  const taskMap = new Map<
    string,
    { generations: number; characters: number; cost: number | null; lastAt: string }
  >();

  for (const g of generations ?? []) {
    const taskId = g.task_id;
    const existing = taskMap.get(taskId);
    if (existing) {
      existing.generations += 1;
      existing.characters += g.characters_generated ?? 0;
      if (g.estimated_cost_usd != null) {
        existing.cost = (existing.cost ?? 0) + Number(g.estimated_cost_usd);
      }
      if (g.created_at > existing.lastAt) {
        existing.lastAt = g.created_at;
      }
    } else {
      taskMap.set(taskId, {
        generations: 1,
        characters: g.characters_generated ?? 0,
        cost: g.estimated_cost_usd != null ? Number(g.estimated_cost_usd) : null,
        lastAt: g.created_at,
      });
    }
  }

  const rows = Array.from(taskMap.entries()).map(([taskId, stats]) => ({
    id: taskId,
    name: taskNameMap.get(taskId) ?? "Unknown",
    generations: stats.generations,
    characters: stats.characters.toLocaleString(),
    cost: stats.cost != null ? `$${stats.cost.toFixed(4)}` : "—",
    lastAt: new Date(stats.lastAt).toLocaleDateString(),
  }));

  const columns = [
    { key: "name", header: "Task" },
    { key: "generations", header: "Generations" },
    { key: "characters", header: "Characters" },
    { key: "cost", header: "Est. Cost" },
    { key: "lastAt", header: "Last Generated" },
  ];

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Admin", href: "/listen-and-log/admin" },
          { label: "Usage & Costs" },
        ]}
      />
      <div className="p-6">
        <LnlCard>
          <h1 className="text-lg font-semibold text-neutral-100">TTS Generation Usage</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cost tracking for on-the-fly TTS generations. Most providers do not return cost in API
            responses; estimated cost may be empty.
          </p>
          <div className="mt-4">
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-8 text-center text-sm text-neutral-500">
                No TTS generations recorded yet.
              </p>
            ) : (
              <LnlTable
                columns={columns}
                data={rows}
                emptyMessage="No data"
              />
            )}
          </div>
        </LnlCard>
      </div>
    </>
  );
}
