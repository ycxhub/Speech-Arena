import { getAdminClient } from "@/lib/supabase/admin";

export type LnlRole = "lnl_admin" | "lnl_auditor" | "lnl_annotator";

export async function getLnlRole(userId: string): Promise<LnlRole | null> {
  const adminClient = getAdminClient();
  const { data } = await adminClient
    .from("lnl_user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return (data?.role as LnlRole) ?? null;
}

export async function hasLnlAccess(userId: string): Promise<boolean> {
  const adminClient = getAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") return true;

  const { data: lnlRole } = await adminClient
    .from("lnl_user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return !!lnlRole;
}

export async function isLnlAdmin(userId: string): Promise<boolean> {
  const adminClient = getAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") return true;

  const { data: lnlRole } = await adminClient
    .from("lnl_user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return lnlRole?.role === "lnl_admin";
}
