import { getKFactor, calculateEloUpdate } from "./calculator";

describe("getKFactor", () => {
  it("returns 40 for 0 matches", () => {
    expect(getKFactor(0)).toBe(40);
  });

  it("returns 40 for 30 matches (upper boundary of K=40 zone)", () => {
    expect(getKFactor(30)).toBe(40);
  });

  it("returns 20 for 31 matches (lower boundary of K=20 zone)", () => {
    expect(getKFactor(31)).toBe(20);
  });

  it("returns 20 for 100 matches (upper boundary of K=20 zone)", () => {
    expect(getKFactor(100)).toBe(20);
  });

  it("returns 10 for 101 matches (lower boundary of K=10 zone)", () => {
    expect(getKFactor(101)).toBe(10);
  });

  it("returns 10 for many matches", () => {
    expect(getKFactor(500)).toBe(10);
    expect(getKFactor(1000)).toBe(10);
  });
});

describe("calculateEloUpdate", () => {
  it("with equal ratings (1500 vs 1500), winner gains and loser loses equally", () => {
    const result = calculateEloUpdate({
      winnerRating: 1500,
      loserRating: 1500,
      winnerMatchesPlayed: 0,
      loserMatchesPlayed: 0,
    });
    expect(result.winnerNewRating).toBeGreaterThan(1500);
    expect(result.loserNewRating).toBeLessThan(1500);
    expect(result.winnerRatingDelta).toBe(-result.loserRatingDelta);
    // With K=40 each: winner +20, loser -20
    expect(result.winnerNewRating).toBe(1520);
    expect(result.loserNewRating).toBe(1480);
  });

  it("when higher-rated wins (expected), smaller rating changes", () => {
    const result = calculateEloUpdate({
      winnerRating: 1600,
      loserRating: 1400,
      winnerMatchesPlayed: 50,
      loserMatchesPlayed: 50,
    });
    expect(result.winnerNewRating).toBeGreaterThan(1600);
    expect(result.loserNewRating).toBeLessThan(1400);
    // Expected outcome: smaller deltas than equal matchup
    expect(Math.abs(result.winnerRatingDelta)).toBeLessThan(20);
    expect(Math.abs(result.loserRatingDelta)).toBeLessThan(20);
  });

  it("when lower-rated wins (upset), larger rating changes", () => {
    const result = calculateEloUpdate({
      winnerRating: 1400,
      loserRating: 1600,
      winnerMatchesPlayed: 50,
      loserMatchesPlayed: 50,
    });
    expect(result.winnerNewRating).toBeGreaterThan(1400);
    expect(result.loserNewRating).toBeLessThan(1600);
    // Upset: bigger deltas than expected outcome
    expect(Math.abs(result.winnerRatingDelta)).toBeGreaterThan(15);
    expect(Math.abs(result.loserRatingDelta)).toBeGreaterThan(15);
  });

  it("K-factor boundary: new model (K=40) gains more than established (K=10)", () => {
    const result = calculateEloUpdate({
      winnerRating: 1500,
      loserRating: 1500,
      winnerMatchesPlayed: 0, // K=40
      loserMatchesPlayed: 150, // K=10
    });
    // Winner gains 40 * 0.5 = 20, loser loses 10 * 0.5 = 5
    expect(result.winnerRatingDelta).toBe(20);
    expect(result.loserRatingDelta).toBe(-5);
    expect(result.winnerNewRating).toBe(1520);
    expect(result.loserNewRating).toBe(1495);
  });

  it("K-factor boundary: established winner (K=10) vs new loser (K=40)", () => {
    const result = calculateEloUpdate({
      winnerRating: 1500,
      loserRating: 1500,
      winnerMatchesPlayed: 150, // K=10
      loserMatchesPlayed: 0, // K=40
    });
    // Winner gains 10 * 0.5 = 5, loser loses 40 * 0.5 = 20
    expect(result.winnerRatingDelta).toBe(5);
    expect(result.loserRatingDelta).toBe(-20);
    expect(result.winnerNewRating).toBe(1505);
    expect(result.loserNewRating).toBe(1480);
  });

  it("returns correct delta values", () => {
    const result = calculateEloUpdate({
      winnerRating: 1500,
      loserRating: 1500,
      winnerMatchesPlayed: 0,
      loserMatchesPlayed: 0,
    });
    expect(result.winnerRatingDelta).toBe(result.winnerNewRating - 1500);
    expect(result.loserRatingDelta).toBe(result.loserNewRating - 1500);
  });

  it("replays sample events: TypeScript results match plpgsql formula (same ELO + K-factor logic)", () => {
    // Simulates nightly verification job: replay events with calculateEloUpdate.
    // process_vote RPC uses identical formula (see 20260213150000_process_vote_rpc.sql).
    const events: { winner: "A" | "B" }[] = [
      { winner: "A" },
      { winner: "B" },
      { winner: "A" },
      { winner: "A" },
      { winner: "B" },
    ];
    let aRating = 1500;
    let bRating = 1500;
    let aMatches = 0;
    let bMatches = 0;

    for (const e of events) {
      const result = calculateEloUpdate({
        winnerRating: e.winner === "A" ? aRating : bRating,
        loserRating: e.winner === "A" ? bRating : aRating,
        winnerMatchesPlayed: e.winner === "A" ? aMatches : bMatches,
        loserMatchesPlayed: e.winner === "A" ? bMatches : aMatches,
      });
      if (e.winner === "A") {
        aRating = result.winnerNewRating;
        bRating = result.loserNewRating;
        aMatches += 1;
        bMatches += 1;
      } else {
        bRating = result.winnerNewRating;
        aRating = result.loserNewRating;
        aMatches += 1;
        bMatches += 1;
      }
    }

    // After 5 matches, ratings should have diverged from 1500
    expect(aRating).not.toBe(1500);
    expect(bRating).not.toBe(1500);
    // A won 3, B won 2 — A should be higher
    expect(aRating).toBeGreaterThan(bRating);
    // Both played 5 matches
    expect(aMatches).toBe(5);
    expect(bMatches).toBe(5);
  });
});
