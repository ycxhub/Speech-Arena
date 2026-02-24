import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EditComparePageForm } from "./edit-form";
import { getComparePage, getModelPagesForSelect } from "../actions";

export default async function EditComparePagePage({
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

  const [comparePage, modelPages] = await Promise.all([
    getComparePage(id),
    getModelPagesForSelect(),
  ]);

  if (!comparePage) notFound();

  return (
    <div className="space-y-8">
      <Link href="/admin/model-pages/compare" className="text-sm text-white/60 hover:text-white block">
        ← Compare Pages
      </Link>
      <h1 className="text-page-title">Edit compare page</h1>
      <EditComparePageForm comparePage={comparePage} modelPages={modelPages} />
    </div>
  );
}
