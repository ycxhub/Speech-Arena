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
    .select("id, voice_id, gender, display_name, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const tableData = (voices ?? []).map((v) => ({
    id: v.id,
    voice_id: v.voice_id,
    gender: v.gender,
    display_name: v.display_name ?? null,
    created_at: formatDate(v.created_at),
  }));

  return (
    <VoicesPageClient
      providerId={providerId}
      providerName={provider.name}
      tableData={tableData}
    />
  );
}
