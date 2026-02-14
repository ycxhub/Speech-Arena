import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { UserRoleSelect } from "./user-role-select";

type ProfileRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPage() {
  // #region agent log - step tracker for production debugging
  let step = "init";
  try {
  step = "createClient";
  // #endregion
  const supabase = await createClient();

  // #region agent log
  step = "getUser";
  // #endregion
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // FIX: Use the service-role (admin) client to bypass RLS.
  // The "Admins can select all profiles" RLS policy causes infinite recursion
  // because it queries the profiles table from within a policy on profiles.
  // The user's identity is already verified via getUser() above, so this is safe.
  // #region agent log
  step = "getAdminClient";
  // #endregion
  const adminClient = getAdminClient();

  // #region agent log
  step = "profileRoleCheck";
  // #endregion
  const { data: currentProfile, error: profileError } = await adminClient
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
  // #region agent log
  step = "fetchAllProfiles";
  // #endregion
  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  // #region agent log
  step = "mapTableData";
  // #endregion
  const tableData: ProfileRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    role: p.role,
    created_at: formatDate(p.created_at),
  }));

  const columns = [
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row: ProfileRow) => (
        <UserRoleSelect userId={row.id} currentRole={row.role} />
      ),
    },
    { key: "created_at", header: "Joined" },
  ];

  // #region agent log
  step = "render";
  // #endregion
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
        <GlassTable<ProfileRow>
          columns={columns}
          data={tableData}
        />
      </GlassCard>
    </div>
  );
  // #region agent log
  } catch (err) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <GlassCard className="flex flex-col items-start gap-4">
          <h2 className="text-xl font-semibold text-white">Admin Debug: Error at step &quot;{step}&quot;</h2>
          <p className="text-white/60">The page failed during the &quot;{step}&quot; phase.</p>
          <p className="text-xs text-white/40">Error type: {err instanceof Error ? err.constructor.name : typeof err}</p>
        </GlassCard>
      </div>
    );
  }
  // #endregion
}
