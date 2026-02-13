import { createClient } from "@/lib/supabase/server";
import { NavBar } from "./nav-bar";

export async function NavBarWithSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log("[NavBar] profile query:", JSON.stringify({ userId: user.id, email: user.email, profile, profileError: profileError?.message ?? null }));
    isAdmin = profile?.role === "admin";
  }

  return (
    <NavBar
      isAdmin={isAdmin}
      user={user?.email ? { email: user.email } : null}
    />
  );
}
