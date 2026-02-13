import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") redirect("/blind-test");

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

      <nav className="flex gap-4 mb-6">
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
