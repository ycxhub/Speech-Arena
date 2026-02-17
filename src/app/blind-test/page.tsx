import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BlindTestClient } from "./blind-test-client";
import { getActiveLanguages, getCompletedRoundsCount } from "./actions";

export default async function BlindTestPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const [languages, completedRoundsCount] = await Promise.all([
    getActiveLanguages(),
    getCompletedRoundsCount(),
  ]);

  return (
    <BlindTestClient
      userId={user.id}
      languages={languages}
      initialCompletedRounds={completedRoundsCount}
    />
  );
}
