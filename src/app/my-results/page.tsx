import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyResultsClient } from "./my-results-client";
import {
  getCompletedTestCount,
  getPersonalLeaderboard,
  getTestHistory,
  getFilterOptions,
} from "./actions";

export default async function MyResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const params = await searchParams;
  const filters = {
    languageId: params.language ?? undefined,
    providerId: params.provider ?? undefined,
    modelId: params.model ?? undefined,
    fromDate: params.from ?? undefined,
    toDate: params.to ?? undefined,
  };
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [completedCount, leaderboard, history, filterOptions] = await Promise.all([
    getCompletedTestCount(user.id),
    getPersonalLeaderboard(user.id, filters),
    getTestHistory(user.id, page, filters),
    getFilterOptions(user.id),
  ]);

  return (
    <MyResultsClient
      completedCount={completedCount}
      initialLeaderboard={leaderboard}
      initialHistory={history}
      filterOptions={filterOptions}
    />
  );
}
