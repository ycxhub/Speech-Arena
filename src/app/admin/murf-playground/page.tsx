import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { listPlaygroundPages } from "./actions";
import { GlassCard } from "@/components/ui/glass-card";
import { PlaygroundListClient } from "./page-client";

export default async function MurfPlaygroundAdminPage() {
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

  const pages = await listPlaygroundPages();

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Murf Playground</h1>
      <GlassCard>
        <p className="mb-4 text-sm text-white/60">
          Manage hidden comparison playground pages. Each page compares two TTS
          models side-by-side with custom voice selection and sample sentences.
        </p>
        <PlaygroundListClient pages={pages} />
      </GlassCard>
    </div>
  );
}
