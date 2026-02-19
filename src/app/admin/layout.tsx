import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/blind-test");

  const { data: providers } = await adminClient
    .from("providers")
    .select("id, name, is_active")
    .order("name");

  const { data: keys } = await adminClient
    .from("api_keys")
    .select("provider_id")
    .eq("status", "active");
  const { data: voices } = await adminClient
    .from("provider_voices")
    .select("provider_id");
  const { data: providerLangs } = await adminClient
    .from("provider_languages")
    .select("provider_id");
  const { data: models } = await adminClient
    .from("models")
    .select("provider_id")
    .eq("is_active", true);

  const hasKeysByProvider = new Set((keys ?? []).map((k) => k.provider_id));
  const hasVoicesByProvider = new Set((voices ?? []).map((v) => v.provider_id));
  const hasLangsByProvider = new Set((providerLangs ?? []).map((p) => p.provider_id));
  const hasModelsByProvider = new Set((models ?? []).map((m) => m.provider_id));

  const providersWithReady = (providers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    is_active: p.is_active,
    is_ready:
      hasKeysByProvider.has(p.id) &&
      hasVoicesByProvider.has(p.id) &&
      hasLangsByProvider.has(p.id) &&
      hasModelsByProvider.has(p.id),
  }));

  return (
    <div className="flex w-full gap-8">
      <aside className="w-56 shrink-0">
        <AdminSidebar providers={providersWithReady} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
