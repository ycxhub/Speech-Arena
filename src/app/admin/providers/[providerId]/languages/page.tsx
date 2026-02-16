import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { LanguagesPageClient } from "./page-client";

export default async function ProviderLanguagesPage({
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

  const { data: allLanguages } = await admin
    .from("languages")
    .select("id, code, name, is_active")
    .order("code");

  const { data: providerLangs } = await admin
    .from("provider_languages")
    .select("language_id")
    .eq("provider_id", providerId);

  const selectedLangIds = new Set((providerLangs ?? []).map((pl) => pl.language_id));

  return (
    <LanguagesPageClient
      providerId={providerId}
      providerName={provider.name}
      allLanguages={allLanguages ?? []}
      selectedLangIds={Array.from(selectedLangIds)}
    />
  );
}
