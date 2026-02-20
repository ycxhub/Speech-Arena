import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LnlLayout } from "@/components/lnl/layout/lnl-layout";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

export default async function ListenAndLogLayout({
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

  const isSiteAdmin = profile?.role === "admin";

  // Check if user has an L&L role (or is a site admin who gets full access)
  let lnlRole: string | null = null;
  let hasAccess = isSiteAdmin;
  if (!isSiteAdmin) {
    const { data: lnlUserRole } = await adminClient
      .from("lnl_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    hasAccess = !!lnlUserRole;
    lnlRole = lnlUserRole?.role ?? null;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
        <LnlCard className="max-w-md">
          <h1 className="text-lg font-semibold text-neutral-100">
            Access required
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            You need an invitation to access Listen & Log. Contact your admin to
            request access.
          </p>
          <Link href="/blind-test" className="mt-4 block">
            <LnlButton variant="secondary" size="sm">
              Back to Speech Arena
            </LnlButton>
          </Link>
        </LnlCard>
      </div>
    );
  }

  const isLnlAdmin = isSiteAdmin || lnlRole === "lnl_admin";

  return <LnlLayout isAdmin={isLnlAdmin}>{children}</LnlLayout>;
}
