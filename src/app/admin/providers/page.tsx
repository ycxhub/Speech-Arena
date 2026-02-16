import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
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
  voice_count: number;
  language_count: number;
  is_ready: boolean;
  next_step: string | null;
  next_step_href: string | null;
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

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/blind-test");

  // Use admin client to bypass RLS (policies reference profiles → infinite recursion)
  const { data: providers } = await admin
    .from("providers")
    .select("id, name, slug, base_url, is_active, created_at")
    .order("name");

  const { data: models } = await admin
    .from("models")
    .select("provider_id, is_active");

  const { data: keys } = await admin
    .from("api_keys")
    .select("provider_id, status");

  const { data: voices } = await admin
    .from("provider_voices")
    .select("provider_id");

  const { data: providerLangs } = await admin
    .from("provider_languages")
    .select("provider_id");

  const keyCountByProvider = (keys ?? []).reduce(
    (acc, { provider_id }) => {
      acc[provider_id] = (acc[provider_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const activeKeyCountByProvider = (keys ?? [])
    .filter((k) => k.status === "active")
    .reduce(
      (acc, { provider_id }) => {
        acc[provider_id] = (acc[provider_id] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  const voiceCountByProvider = (voices ?? []).reduce(
    (acc, { provider_id }) => {
      acc[provider_id] = (acc[provider_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const langCountByProvider = (providerLangs ?? []).reduce(
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

  function getNextStep(providerId: string): { label: string; href: string } | null {
    const hasKeys = (activeKeyCountByProvider[providerId] ?? 0) > 0;
    const hasLanguages = (langCountByProvider[providerId] ?? 0) > 0;
    const hasVoices = (voiceCountByProvider[providerId] ?? 0) > 0;
    const hasModels = (countByProvider[providerId]?.active ?? 0) > 0;

    if (!hasKeys) return { label: "Add API key", href: `/admin/providers/${providerId}/keys` };
    if (!hasLanguages) return { label: "Add languages", href: `/admin/providers/${providerId}/languages` };
    if (!hasVoices) return { label: "Add voices", href: `/admin/providers/${providerId}/voices` };
    if (!hasModels) return { label: "Add models", href: `/admin/providers/${providerId}/models` };
    return null;
  }

  const tableData: ProviderRow[] = (providers ?? []).map((p) => {
    const hasKeys = (activeKeyCountByProvider[p.id] ?? 0) > 0;
    const hasLanguages = (langCountByProvider[p.id] ?? 0) > 0;
    const hasVoices = (voiceCountByProvider[p.id] ?? 0) > 0;
    const hasModels = (countByProvider[p.id]?.active ?? 0) > 0;
    const is_ready = hasKeys && hasLanguages && hasVoices && hasModels;
    const next = getNextStep(p.id);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      base_url: p.base_url,
      is_active: p.is_active,
      model_count_active: countByProvider[p.id]?.active ?? 0,
      model_count_total: countByProvider[p.id]?.total ?? 0,
      key_count: keyCountByProvider[p.id] ?? 0,
      voice_count: voiceCountByProvider[p.id] ?? 0,
      language_count: langCountByProvider[p.id] ?? 0,
      is_ready,
      next_step: next?.label ?? null,
      next_step_href: next?.href ?? null,
      created_at: formatDate(p.created_at),
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Providers</h1>

      <ProvidersPageClient tableData={tableData} />
    </div>
  );
}
