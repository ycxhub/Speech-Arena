import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EditModelPageForm } from "./edit-form";
import { getModelPage } from "../actions";

export default async function EditModelPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const modelPage = await getModelPage(id);
  if (!modelPage) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/model-pages" className="text-white/60 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-page-title">Edit: {modelPage.definition_name as string}</h1>
      </div>

      <EditModelPageForm modelPage={modelPage} />
    </div>
  );
}
