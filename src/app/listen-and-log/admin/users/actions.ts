"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { revalidatePath } from "next/cache";

export async function inviteUser(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  if (!email || !role) return { error: "Email and role are required" };
  if (!["lnl_admin", "lnl_auditor", "lnl_annotator"].includes(role)) {
    return { error: "Invalid role" };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const adminClient = getAdminClient();
  const { error } = await adminClient.from("lnl_invitations").insert({
    email,
    role,
    invited_by: user.id,
    token,
    status: "pending",
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/users");
  return { success: true, token };
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/users");
  return { success: true };
}

export async function resendInvitation(invitationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const newToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_invitations")
    .update({ token: newToken, expires_at: expiresAt, status: "pending" })
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/users");
  return { success: true, token: newToken };
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  if (!["lnl_admin", "lnl_auditor", "lnl_annotator"].includes(newRole)) {
    return { error: "Invalid role" };
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_user_roles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/users");
  return { success: true };
}

export async function removeUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) return { error: "Not authorized" };

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("lnl_user_roles")
    .delete()
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/listen-and-log/admin/users");
  return { success: true };
}

export async function getInvitations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("lnl_invitations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function getLnlUsers() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  const adminClient = getAdminClient();
  const { data: roles, error } = await adminClient
    .from("lnl_user_roles")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };

  const userIds = (roles ?? []).map((r) => r.user_id);
  if (userIds.length === 0) {
    return { data: [] };
  }

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { email: p.email, display_name: p.display_name }])
  );

  const users = [];
  for (const r of roles ?? []) {
    let email = profileMap.get(r.user_id)?.email;
    const display_name = profileMap.get(r.user_id)?.display_name ?? null;
    if (!email || email === "Unknown") {
      const { data } = await adminClient.auth.admin.getUserById(r.user_id);
      email = data?.user?.email ?? "Unknown";
    }
    users.push({
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      email,
      display_name,
    });
  }

  const pendingEmails = new Set(
    (
      await adminClient
        .from("lnl_invitations")
        .select("email")
        .eq("status", "pending")
    ).data?.map((i) => i.email.toLowerCase()) ?? []
  );
  const existingUserIds = new Set(userIds);
  const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  for (const u of authUsers?.users ?? []) {
    const email = u.email?.toLowerCase();
    if (!email || existingUserIds.has(u.id)) continue;
    if (!pendingEmails.has(email)) continue;
    const { data: invs } = await adminClient
      .from("lnl_invitations")
      .select("email, role, invited_by")
      .eq("status", "pending");
    const inv = (invs ?? []).find(
      (i) => i.email?.toLowerCase() === (u.email ?? "").toLowerCase()
    );
    if (!inv) continue;
    users.push({
      user_id: u.id,
      role: inv.role,
      created_at: u.created_at ?? new Date().toISOString(),
      email: u.email ?? "Unknown",
      display_name: (u.user_metadata as { full_name?: string })?.full_name ?? null,
    });
  }

  return { data: users };
}
