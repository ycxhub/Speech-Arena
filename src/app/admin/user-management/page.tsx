import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { AdminUserTable } from "../admin-user-table";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function UserManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const adminClient = getAdminClient();

  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") redirect("/blind-test");

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
      <h1 className="text-page-title">User Management</h1>

      <GlassCard>
        <p className="mb-4 text-sm text-white/60">
          View all users and manage roles. Only admins can promote users.
        </p>
        <AdminUserTable data={tableData} />
      </GlassCard>
    </div>
  );
}
