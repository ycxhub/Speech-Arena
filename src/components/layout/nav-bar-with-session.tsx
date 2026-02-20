import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NavBar } from "./nav-bar";

export async function NavBarWithSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let hasLnlAccess = false;

  if (user) {
    const adminClient = getAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin";
    hasLnlAccess = isAdmin;

    if (!hasLnlAccess) {
      const { data: lnlRole } = await adminClient
        .from("lnl_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      hasLnlAccess = !!lnlRole;
    }
  }

  return (
    <NavBar
      isAdmin={isAdmin}
      hasLnlAccess={hasLnlAccess}
      user={user?.email ? { email: user.email } : null}
    />
  );
}
