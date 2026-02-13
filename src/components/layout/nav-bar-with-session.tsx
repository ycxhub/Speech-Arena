import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NavBar } from "./nav-bar";

export async function NavBarWithSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    // Use admin client to bypass RLS – the user's identity is already
    // verified via getUser() above, so this is safe.
    const adminClient = getAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin";
  }

  return (
    <NavBar
      isAdmin={isAdmin}
      user={user?.email ? { email: user.email } : null}
    />
  );
}
