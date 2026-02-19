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

  const tableData: ProviderRow[] = (providers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    base_url: p.base_url,
    is_active: p.is_active,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Providers</h1>

      <ProvidersPageClient tableData={tableData} />
    </div>
  );
}
