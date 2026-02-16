import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SentencesPageClient } from "./page-client";

export type SentenceRow = {
  id: string;
  text: string;
  language_code: string;
  language_name: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const PAGE_SIZE = 25;

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function SentencesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; language?: string; status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const languageCode = params.language ?? "";
  const status = params.status ?? "all";
  const q = params.q ?? "";

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
  const { data: allLanguages } = await admin
    .from("languages")
    .select("id, code, name, is_active");

  const languages = allLanguages ?? [];
  const activeLanguages = languages.filter((l) => l.is_active);
  const langById = new Map(languages.map((l) => [l.id, l]));

  let query = admin
    .from("sentences")
    .select("id, text, language_id, version, is_active, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (languageCode) {
    const lang = languages.find((l) => l.code === languageCode);
    if (lang) query = query.eq("language_id", lang.id);
  }

  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  if (q.trim()) query = query.ilike("text", `%${q.trim()}%`);

  const { data: sentences, count } = await query;

  const tableData: SentenceRow[] = (sentences ?? []).map((s) => {
    const lang = langById.get(s.language_id);
    return {
      id: s.id,
      text: s.text,
      language_code: lang?.code ?? "",
      language_name: lang?.name ?? "",
      version: s.version,
      is_active: s.is_active,
      created_at: formatDate(s.created_at),
      updated_at: formatDate(s.updated_at),
    };
  });

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const languageOptions = languages.map((l) => ({
    value: l.code,
    label: `${l.name} (${l.code})`,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Sentences</h1>

      <SentencesPageClient
        tableData={tableData}
        languages={languageOptions}
        activeLanguages={activeLanguages}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count ?? 0}
      />
    </div>
  );
}
