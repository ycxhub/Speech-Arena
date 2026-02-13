import { createClient } from "@/lib/supabase/server";
import { NavBar } from "./nav-bar";

export async function NavBarWithSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/f4ab0884-c40f-42d9-8400-21a6b7719960',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nav-bar-with-session.tsx:getUser',message:'getUser result in NavBar',data:{hasUser:!!user,userEmail:user?.email??null,error:getUserError?.message??null,hypothesisId:'H1-H5'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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
