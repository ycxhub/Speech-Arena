import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { TestApiPageClient } from "./page-client";

export default async function TestApiPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
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

  const { data: provider } = await admin
    .from("providers")
    .select("id, name")
    .eq("id", providerId)
    .single();
  if (!provider) notFound();

  const [
    { count: keyCount },
    { data: models },
    { data: providerLangs },
    { data: providerVoices },
  ] = await Promise.all([
    admin.from("api_keys").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("status", "active"),
    admin.from("models").select("id, name, model_id, voice_id").eq("provider_id", providerId).eq("is_active", true).order("name"),
    admin.from("provider_languages").select("language_id").eq("provider_id", providerId),
    admin.from("provider_voices").select("voice_id, display_name").eq("provider_id", providerId),
  ]);

  const hasKeys = (keyCount ?? 0) > 0;
  const hasModels = (models ?? []).length > 0;
  const hasVoices = (providerVoices ?? []).length > 0;
  const isReady = hasKeys && hasModels && hasVoices;

  const missingItems: { label: string; href: string }[] = [];
  if (!hasKeys) missingItems.push({ label: "Add at least one API key", href: `/admin/providers/${providerId}/keys` });
  if (!hasVoices) missingItems.push({ label: "Add voices", href: `/admin/providers/${providerId}/voices` });
  if (!hasModels) missingItems.push({ label: "Add models", href: `/admin/providers/${providerId}/models` });

  let languages: { id: string; code: string; name: string }[] = [];
  if (providerLangs && providerLangs.length > 0) {
    const langIds = providerLangs.map((pl) => pl.language_id);
    const { data: langRows } = await admin
      .from("languages")
      .select("id, code, name")
      .in("id", langIds)
      .eq("is_active", true)
      .order("code");
    languages = langRows ?? [];
  } else {
    const { data: allLangs } = await admin
      .from("languages")
      .select("id, code, name")
      .eq("is_active", true)
      .order("code");
    languages = allLangs ?? [];
  }

  const voiceByVoiceId = new Map(
    (providerVoices ?? []).map((v) => [v.voice_id, v.display_name ?? v.voice_id])
  );
  const modelsWithDisplayName = (models ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    model_id: m.model_id,
    voice_id: m.voice_id ?? null,
    display_name: m.voice_id
      ? (voiceByVoiceId.get(m.voice_id) ?? m.voice_id)
      : m.name,
  }));

  return (
    <div className="space-y-6">
      <TestApiPageClient
        providerId={providerId}
        models={modelsWithDisplayName}
        languages={languages}
        isReady={isReady}
        missingItems={missingItems}
      />
    </div>
  );
}
