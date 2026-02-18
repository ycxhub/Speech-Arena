import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CustomTestClient } from "./custom-test-client";
import { getActiveLanguages } from "../blind-test/actions";

export default async function CustomTestPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const languages = await getActiveLanguages();

  return <CustomTestClient languages={languages} />;
}
