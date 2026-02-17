import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApiPlaygroundClient } from "./page-client";

export default async function ApiPlaygroundPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">API Playground</h1>
      <ApiPlaygroundClient />
    </div>
  );
}
