import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ModelPagesPageClient } from "./page-client";
import { listModelPages } from "./actions";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

export default async function ModelPagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const tableData = await listModelPages();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Model Pages</h1>
        <div className="flex gap-2">
          <Link href="/admin/model-pages/compare">
            <GlassButton variant="secondary">Compare Pages</GlassButton>
          </Link>
          <Link href="/admin/model-pages/new">
            <GlassButton>Create model page</GlassButton>
          </Link>
        </div>
      </div>

      <GlassCard>
        <p className="mb-4 text-sm text-white/60">
          Manage SEO model pages for TTS engine definitions. Each page displays rank, pricing, capabilities, and links to compare/alternatives.
        </p>
        <ModelPagesPageClient tableData={tableData} />
      </GlassCard>
    </div>
  );
}
