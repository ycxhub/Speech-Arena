"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Updates a user's role. Only admins can call this.
 * Uses the service-role (admin) client for profiles queries to bypass RLS
 * (the "Admins can select all profiles" policy causes infinite recursion).
 */
export async function updateUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const admin = getAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: admin access required" };
  }

  // Use admin client for the update too — the UPDATE RLS policy also has recursion.
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return {};
}
