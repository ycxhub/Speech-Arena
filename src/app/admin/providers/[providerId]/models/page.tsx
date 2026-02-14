import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { ModelsPageClient } from "./page-client";
import type { ModelRow } from "./model-types";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ModelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<{
    gender?: string;
    language?: string;
    tag?: string;
    status?: string;
    q?: string;
  }>;
}) {
  const { providerId } = await params;
  const sp = await searchParams;
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
    .select("id")
    .eq("id", providerId)
    .single();
  if (!provider) notFound();

  let query = admin
    .from("models")
    .select(
      `
      id,
      name,
      model_id,
      voice_id,
      gender,
      tags,
      is_active,
      created_at,
      model_languages (
        languages (code)
      )
    `
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (sp.status === "active") query = query.eq("is_active", true);
  if (sp.status === "inactive") query = query.eq("is_active", false);
  if (sp.gender) query = query.eq("gender", sp.gender);
  if (sp.tag) query = query.contains("tags", [sp.tag]);
  if (sp.q?.trim()) {
    query = query.or(
      `name.ilike.%${sp.q.trim()}%,model_id.ilike.%${sp.q.trim()}%`
    );
  }

  let { data: models } = await query;

  // Filter by language in memory (models that support this language)
  if (sp.language && models) {
    models = models.filter((m) => {
      const ml = m.model_languages as { languages: { code: string } | null }[] | null;
      const codes = (ml ?? []).map((x) => x?.languages?.code).filter(Boolean);
      return codes.includes(sp.language!);
    });
  }

  const tableData: ModelRow[] = (models ?? []).map((m) => {
    const ml = m.model_languages as { languages: { code: string } | null }[] | null;
    const codes = (ml ?? [])
      .map((x) => x?.languages?.code)
      .filter(Boolean) as string[];
    return {
      id: m.id,
      name: m.name,
      model_id: m.model_id,
      voice_id: m.voice_id ?? null,
      gender: m.gender,
      languages: codes,
      tags: m.tags ?? [],
      is_active: m.is_active,
      created_at: formatDate(m.created_at),
    };
  });

  const { data: languages } = await admin
    .from("languages")
    .select("id, code, name")
    .eq("is_active", true)
    .order("code");

  return (
    <ModelsPageClient
      providerId={providerId}
      tableData={tableData}
      languages={languages ?? []}
      filters={{
        gender: sp.gender ?? "",
        language: sp.language ?? "",
        tag: sp.tag ?? "",
        status: sp.status ?? "",
        q: sp.q ?? "",
      }}
    />
  );
}
