import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { LanguagesPageClient } from "./page-client";

export type LanguageRow = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  sentence_count: number;
  created_at: string;
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function LanguagesPage() {
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
  const { data: languages } = await admin
    .from("languages")
    .select("id, name, code, is_active, created_at")
    .order("name");

  const { data: sentences } = await admin
    .from("sentences")
    .select("language_id");

  const countByLang = (sentences ?? []).reduce(
    (acc, { language_id }) => {
      acc[language_id] = (acc[language_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const tableData: LanguageRow[] = (languages ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    code: l.code,
    is_active: l.is_active,
    sentence_count: countByLang[l.id] ?? 0,
    created_at: formatDate(l.created_at),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Languages</h1>

      <LanguagesPageClient
        tableData={tableData}
      />
    </div>
  );
}
