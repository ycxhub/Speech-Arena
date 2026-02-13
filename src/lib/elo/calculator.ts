/**
 * ELO rating calculator for TTS Arena (PRD 10).
 * Pure functions with no side effects — easy to unit test.
 */

/**
 * Returns the K-factor based on matches played.
 * Dynamic K-factor: new models adjust quickly, established models adjust slowly.
 */
export function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed <= 30) return 40;
  if (matchesPlayed <= 100) return 20;
  return 10;
}

export interface EloUpdateResult {
  winnerNewRating: number;
  loserNewRating: number;
  winnerRatingDelta: number;
  loserRatingDelta: number;
}

/**
 * Calculates ELO rating updates for a match.
 * Expected score: E = 1 / (1 + 10^((R_opponent - R_self) / 400))
 * Actual score: winner = 1, loser = 0
 * Update: R_new = R + K * (S - E)
 */
export function calculateEloUpdate(params: {
  winnerRating: number;
  loserRating: number;
  winnerMatchesPlayed: number;
  loserMatchesPlayed: number;
}): EloUpdateResult {
  const { winnerRating, loserRating, winnerMatchesPlayed, loserMatchesPlayed } = params;

  const kWinner = getKFactor(winnerMatchesPlayed);
  const kLoser = getKFactor(loserMatchesPlayed);

  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const winnerNewRating = winnerRating + kWinner * (1 - expectedWinner);
  const loserNewRating = loserRating + kLoser * (0 - expectedLoser);

  return {
    winnerNewRating,
    loserNewRating,
    winnerRatingDelta: winnerNewRating - winnerRating,
    loserRatingDelta: loserNewRating - loserRating,
  };
}
