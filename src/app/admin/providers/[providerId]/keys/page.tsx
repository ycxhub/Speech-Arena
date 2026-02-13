import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { KeysPageClient } from "./page-client";

export type KeyRow = {
  id: string;
  key_name: string;
  status: string;
  masked_preview: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function KeysPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("id", providerId)
    .single();
  if (!provider) notFound();

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, key_name, status, masked_preview, created_at, updated_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const tableData: KeyRow[] = (keys ?? []).map((k) => ({
    id: k.id,
    key_name: k.key_name,
    status: k.status,
    masked_preview: k.masked_preview ?? "****",
    created_at: formatDate(k.created_at),
    updated_at: formatDate(k.updated_at),
  }));

  return (
    <KeysPageClient
      providerId={providerId}
      tableData={tableData}
    />
  );
}
