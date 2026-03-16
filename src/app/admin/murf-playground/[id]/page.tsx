import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import {
  getPlaygroundPage,
  listSentencesForPage,
  getLanguagesForAdmin,
} from "../actions";
import { PlaygroundEditClient } from "./page-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlaygroundEditPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const page = await getPlaygroundPage(id);
  if (!page) notFound();

  const sentences = await listSentencesForPage(id);
  const languages = await getLanguagesForAdmin();

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Edit: {page.slug}</h1>
      <PlaygroundEditClient
        page={page}
        sentences={sentences}
        languages={languages}
      />
    </div>
  );
}
