import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateComparePageForm } from "./create-form";
import { getModelPagesForSelect } from "../actions";

export default async function NewComparePagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const modelPages = await getModelPagesForSelect();

  return (
    <div className="space-y-8">
      <Link href="/admin/model-pages/compare" className="text-sm text-white/60 hover:text-white block">
        ← Compare Pages
      </Link>
      <h1 className="text-page-title">Create compare page</h1>
      <CreateComparePageForm modelPages={modelPages} />
    </div>
  );
}
