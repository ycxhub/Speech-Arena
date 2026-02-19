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
  is_ready: boolean;
};

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

  const { data: providers } = await admin
    .from("providers")
    .select("id, name, slug, base_url, is_active")
    .order("name");

  const { data: keys } = await admin
    .from("api_keys")
    .select("provider_id, status")
    .eq("status", "active");
  const { data: voices } = await admin
    .from("provider_voices")
    .select("provider_id");
  const { data: providerLangs } = await admin
    .from("provider_languages")
    .select("provider_id");
  const { data: models } = await admin
    .from("models")
    .select("provider_id, is_active")
    .eq("is_active", true);

  const hasKeysByProvider = new Set((keys ?? []).map((k) => k.provider_id));
  const hasVoicesByProvider = new Set((voices ?? []).map((v) => v.provider_id));
  const hasLangsByProvider = new Set((providerLangs ?? []).map((p) => p.provider_id));
  const hasModelsByProvider = new Set((models ?? []).map((m) => m.provider_id));

  const tableData: ProviderRow[] = (providers ?? []).map((p) => {
    const is_ready =
      hasKeysByProvider.has(p.id) &&
      hasVoicesByProvider.has(p.id) &&
      hasLangsByProvider.has(p.id) &&
      hasModelsByProvider.has(p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      base_url: p.base_url,
      is_active: p.is_active,
      is_ready,
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Providers</h1>

      <ProvidersPageClient tableData={tableData} />
    </div>
  );
}
