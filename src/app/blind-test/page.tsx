import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BlindTestClient } from "./blind-test-client";
import { getActiveLanguages } from "./actions";

export default async function BlindTestPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const languages = await getActiveLanguages();

  return <BlindTestClient userId={user.id} languages={languages} />;
}
