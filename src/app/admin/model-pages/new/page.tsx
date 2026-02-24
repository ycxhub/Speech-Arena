import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateModelPageForm } from "./create-form";
import { getProvidersWithDefinitions } from "../actions";

export default async function NewModelPagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const providersWithDefs = await getProvidersWithDefinitions();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/model-pages" className="text-white/60 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-page-title">Create model page</h1>
      </div>

      <CreateModelPageForm providersWithDefs={providersWithDefs} />
    </div>
  );
}
