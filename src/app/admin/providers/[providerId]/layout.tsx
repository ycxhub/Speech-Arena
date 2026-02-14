import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
import { ProviderTabs } from "./provider-tabs";

export default async function ProviderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await getAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, slug")
    .eq("id", providerId)
    .single();

  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link href="/admin/providers">
              <GlassButton variant="ghost" size="sm">
                ← Providers
              </GlassButton>
            </Link>
            <span className="text-white/40">/</span>
            <h1 className="text-page-title">{provider.name}</h1>
          </div>
          <p className="text-sm text-white/60">
            Manage models and API keys for {provider.name}
          </p>
        </div>
      </div>

      <ProviderTabs providerId={providerId} />

      {children}
    </div>
  );
}
