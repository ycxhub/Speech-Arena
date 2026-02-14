import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
import { ProvidersPageClient } from "./page-client";

export type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  base_url: string | null;
  is_active: boolean;
  model_count_active: number;
  model_count_total: number;
  key_count: number;
  created_at: string;
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProvidersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await getAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const { data: providers } = await supabase
    .from("providers")
    .select("id, name, slug, base_url, is_active, created_at")
    .order("name");

  const { data: models } = await supabase
    .from("models")
    .select("provider_id, is_active");

  const { data: keys } = await supabase
    .from("api_keys")
    .select("provider_id");

  const keyCountByProvider = (keys ?? []).reduce(
    (acc, { provider_id }) => {
      acc[provider_id] = (acc[provider_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const countByProvider = (models ?? []).reduce(
    (acc, { provider_id, is_active }) => {
      if (!acc[provider_id]) acc[provider_id] = { active: 0, total: 0 };
      acc[provider_id].total++;
      if (is_active) acc[provider_id].active++;
      return acc;
    },
    {} as Record<string, { active: number; total: number }>
  );

  const tableData: ProviderRow[] = (providers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    base_url: p.base_url,
    is_active: p.is_active,
    model_count_active: countByProvider[p.id]?.active ?? 0,
    model_count_total: countByProvider[p.id]?.total ?? 0,
    key_count: keyCountByProvider[p.id] ?? 0,
    created_at: formatDate(p.created_at),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Providers</h1>
        <Link href="/admin">
          <GlassButton variant="ghost" size="sm">
            ← Back to Dashboard
          </GlassButton>
        </Link>
      </div>

      <ProvidersPageClient tableData={tableData} />
    </div>
  );
}
