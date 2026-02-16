import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
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

  const admin = getAdminClient();
  const { data: provider } = await admin
    .from("providers")
    .select("id, name, slug")
    .eq("id", providerId)
    .single();

  if (!provider) notFound();

  const [
    { count: activeKeyCount },
    { count: activeModelCount },
    { count: voiceCount },
    { count: langCount },
  ] = await Promise.all([
    admin.from("api_keys").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("status", "active"),
    admin.from("models").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("is_active", true),
    admin.from("provider_voices").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    admin.from("provider_languages").select("provider_id", { count: "exact", head: true }).eq("provider_id", providerId),
  ]);

  const hasKeys = (activeKeyCount ?? 0) > 0;
  const hasModels = (activeModelCount ?? 0) > 0;
  const hasVoices = (voiceCount ?? 0) > 0;
  const hasLanguages = (langCount ?? 0) > 0;
  const isReady = hasKeys && hasModels && hasVoices && hasLanguages;

  const nextStep =
    !hasKeys
      ? { label: "Add at least one API key", href: `/admin/providers/${providerId}/keys` }
      : !hasLanguages
        ? { label: "Add languages", href: `/admin/providers/${providerId}/languages` }
        : !hasVoices
          ? { label: "Add voices (required for models)", href: `/admin/providers/${providerId}/voices` }
          : !hasModels
            ? { label: "Add models", href: `/admin/providers/${providerId}/models` }
            : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-page-title">{provider.name}</h1>
        <p className="text-sm text-white/60">
          Manage models and API keys for {provider.name}
        </p>
      </div>

      {!isReady && nextStep && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-200">
            This provider is not ready for blind tests.{" "}
            <Link href={nextStep.href} className="font-medium text-accent-blue hover:underline">
              Next: {nextStep.label}
            </Link>
          </p>
        </div>
      )}

      <ProviderTabs providerId={providerId} />

      {children}
    </div>
  );
}
