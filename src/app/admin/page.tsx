import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { AdminUserTable } from "./admin-user-table";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // FIX: Use the service-role (admin) client to bypass RLS.
  // The "Admins can select all profiles" RLS policy causes infinite recursion
  // because it queries the profiles table from within a policy on profiles.
  // The user's identity is already verified via getUser() above, so this is safe.
  const adminClient = getAdminClient();

  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="w-full max-w-md text-center">
          <h1 className="mb-2 text-xl font-semibold text-white">
            Admin Access Required
          </h1>
          <p className="text-white/80">
            Please upgrade your role to Admin to access this page.
          </p>
        </GlassCard>
      </div>
    );
  }

  // FIX: Also use admin client for fetching all profiles to avoid the same RLS recursion.
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  const tableData = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email ?? "",
    role: p.role === "admin" ? "admin" : "user",
    created_at: formatDate(p.created_at ?? new Date().toISOString()),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Admin Dashboard</h1>

      <nav className="flex flex-wrap gap-4 mb-6">
        <Link
          href="/admin/languages"
          className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
        >
          Languages
        </Link>
        <Link
          href="/admin/sentences"
          className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
        >
          Sentences
        </Link>
        <Link
          href="/admin/providers"
          className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
        >
          Providers
        </Link>
        <Link
          href="/admin/logs"
          className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
        >
          Test Logs
        </Link>
        <Link
          href="/admin/analytics"
          className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
        >
          Analytics
        </Link>
        <Link
          href="/admin/audit-log"
          className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
        >
          Audit Log
        </Link>
      </nav>

      <GlassCard>
        <h2 className="mb-4 text-section-heading">User Management</h2>
        <p className="mb-4 text-sm text-white/60">
          View all users and manage roles. Only admins can promote users.
        </p>
        <AdminUserTable data={tableData} />
      </GlassCard>
    </div>
  );
}
