import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { UserRoleSelect } from "./user-role-select";
// #region agent log
import { appendFileSync } from "fs";
const DBG_LOG = process.cwd() + "/.cursor/debug.log";
function dbgLog(loc: string, data: Record<string, unknown>) { try { appendFileSync(DBG_LOG, JSON.stringify({location:loc,data,timestamp:Date.now()}) + "\n"); } catch {} }
// #endregion

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // #region agent log
  console.log('[DEBUG ADMIN_PAGE:GET_USER]', JSON.stringify({hasUser:!!user,userId:user?.id||null}));
  dbgLog('admin/page.tsx:GET_USER', {hasUser:!!user,userId:user?.id||null});
  // #endregion

  if (!user) redirect("/auth/sign-in");

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // #region agent log
  console.log('[DEBUG ADMIN_PAGE:PROFILE_CHECK]', JSON.stringify({userId:user.id,currentProfile,profileError:profileError?.message||null,willRedirect:currentProfile?.role!=='admin'}));
  dbgLog('admin/page.tsx:PROFILE_CHECK', {userId:user.id,currentProfile,profileError:profileError?.message||null,willRedirect:currentProfile?.role!=='admin'});
  // #endregion

  // #region agent log - URL-visible diagnostics for production debugging
  if (currentProfile?.role !== "admin") redirect(`/blind-test?_dbg_src=adminpage&_dbg_role=${currentProfile?.role || "null"}&_dbg_err=${profileError?.message || "none"}`);
  // #endregion

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

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
}
