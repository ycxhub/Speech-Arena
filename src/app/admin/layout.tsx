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

  return (
    <div className="flex w-full gap-8">
      <aside className="w-56 shrink-0">
        <AdminSidebar providers={providers ?? []} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
