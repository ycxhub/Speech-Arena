import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { VoicesPageClient } from "./page-client";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function VoicesPage({
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

  const { data: voices } = await admin
    .from("provider_voices")
    .select("id, voice_id, gender, display_name, language_id, model_id, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const { data: modelDefinitions } = await admin
    .from("provider_model_definitions")
    .select("id, name, model_id")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const { data: languages } = await admin
    .from("languages")
    .select("id, code")
    .eq("is_active", true)
    .order("code");

  const langById = new Map((languages ?? []).map((l) => [l.id, l]));

  const tableData = (voices ?? []).map((v) => ({
    id: v.id,
    voice_id: v.voice_id,
    gender: v.gender,
    display_name: v.display_name ?? null,
    language_id: v.language_id,
    language_code: langById.get(v.language_id ?? "")?.code ?? "—",
    model_id: v.model_id ?? null,
    model_id_display: v.model_id ?? "—",
    created_at: formatDate(v.created_at),
  }));

  return (
    <VoicesPageClient
      providerId={providerId}
      providerName={provider.name}
      tableData={tableData}
      languages={languages ?? []}
      modelDefinitions={modelDefinitions ?? []}
    />
  );
}
