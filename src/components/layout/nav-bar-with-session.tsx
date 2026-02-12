import { createClient } from "@/lib/supabase/server";
import { NavBar } from "./nav-bar";

export async function NavBarWithSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
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
