import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const { data: languages } = await supabase
    .from("languages")
    .select("id, name, code, is_active, created_at")
    .order("name");

  const { data: sentences } = await supabase
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
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Languages</h1>
        <Link href="/admin">
          <GlassButton variant="ghost" size="sm">
            ← Back to Dashboard
          </GlassButton>
        </Link>
      </div>

      <LanguagesPageClient
        tableData={tableData}
      />
    </div>
  );
}
