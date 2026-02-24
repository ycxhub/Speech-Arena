import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComparePagesPageClient } from "./page-client";
import { listComparePages } from "./actions";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

export default async function ComparePagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const tableData = await listComparePages();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/model-pages" className="text-sm text-white/60 hover:text-white mb-2 block">
            ← Model Pages
          </Link>
          <h1 className="text-page-title">Compare Pages</h1>
        </div>
        <Link href="/admin/model-pages/compare/new">
          <GlassButton>Create compare page</GlassButton>
        </Link>
      </div>

      <GlassCard>
        <p className="mb-4 text-sm text-white/60">
          Admin-defined compare pages with custom slugs. When both models are selected in the compare hub, users are redirected here if a compare page exists.
        </p>
        <ComparePagesPageClient tableData={tableData} />
      </GlassCard>
    </div>
  );
}
