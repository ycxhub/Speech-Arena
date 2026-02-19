import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyResultsClient } from "./my-results-client";
import {
  getCompletedTestCount,
  getPersonalLeaderboard,
  getTestHistory,
  getFilterOptions,
  getCustomTestWinRateSummary,
  type TestType,
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
  const testType: TestType =
    params.type === "custom" ? "custom" : "blind";
  const filters = {
    languageId: params.language ?? undefined,
    providerId: params.provider ?? undefined,
    modelId: params.model ?? undefined,
    fromDate: params.from ?? undefined,
    toDate: params.to ?? undefined,
  };
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [completedCount, leaderboard, history, filterOptions, customWinRateSummary] =
    await Promise.all([
      getCompletedTestCount(user.id, testType),
      getPersonalLeaderboard(user.id, filters, testType),
      getTestHistory(user.id, page, filters, testType),
      getFilterOptions(user.id, testType),
      testType === "custom"
        ? getCustomTestWinRateSummary(user.id, filters)
        : Promise.resolve(null),
    ]);

  return (
    <MyResultsClient
      testType={testType}
      completedCount={completedCount}
      initialLeaderboard={leaderboard}
      initialHistory={history}
      filterOptions={filterOptions}
      customWinRateSummary={customWinRateSummary?.summary ?? null}
    />
  );
}
