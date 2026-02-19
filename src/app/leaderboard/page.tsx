import { LeaderboardClient } from "./leaderboard-client";
import {
  getGlobalLeaderboard,
  getLeaderboardOptions,
  getLeaderboardSummary,
  getPairwiseWinRateMatrix,
} from "./actions";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    languageId: params.language ?? undefined,
    providerId: params.provider ?? undefined,
    minMatches: params.min_matches ? parseInt(params.min_matches, 10) : undefined,
  };

  const [data, options, summary, pairwiseMatrix] = await Promise.all([
    getGlobalLeaderboard(filters),
    getLeaderboardOptions(),
    getLeaderboardSummary(),
    getPairwiseWinRateMatrix(filters),
  ]);

  return (
    <LeaderboardClient
      initialData={data}
      summary={summary}
      languages={options.languages}
      providers={options.providers}
      pairwiseMatrix={pairwiseMatrix}
    />
  );
}
