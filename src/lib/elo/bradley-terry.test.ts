import { betaToElo, calculateBradleyTerryRatings } from "./bradley-terry";

describe("betaToElo", () => {
  it("uses the Bradley-Terry to Elo conversion from the reference document", () => {
    expect(betaToElo(0)).toBe(1000);
    expect(betaToElo(0.74)).toBeCloseTo(1128.56, 1);
    expect(betaToElo(-1.12)).toBeCloseTo(805.42, 1);
  });
});

describe("calculateBradleyTerryRatings", () => {
  it("returns an empty list when there are no outcomes", () => {
    expect(calculateBradleyTerryRatings([])).toEqual([]);
  });

  it("includes explicit model keys that have no outcomes", () => {
    const ratings = calculateBradleyTerryRatings([], { modelKeys: ["A"] });

    expect(ratings).toEqual([
      {
        modelKey: "A",
        beta: 0,
        rating: 1000,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    ]);
  });

  it("keeps symmetric outcomes tied", () => {
    const ratings = calculateBradleyTerryRatings([
      { winnerKey: "A", loserKey: "B" },
      { winnerKey: "B", loserKey: "A" },
    ]);

    expect(ratings).toHaveLength(2);
    expect(ratings[0].rating).toBeCloseTo(ratings[1].rating, 8);
    expect(ratings[0].rating).toBeCloseTo(1000, 8);
  });

  it("ranks a dominant model higher", () => {
    const ratings = calculateBradleyTerryRatings([
      { winnerKey: "A", loserKey: "B" },
      { winnerKey: "A", loserKey: "B" },
      { winnerKey: "A", loserKey: "C" },
      { winnerKey: "B", loserKey: "C" },
    ]);

    const byKey = new Map(ratings.map((rating) => [rating.modelKey, rating]));
    expect(byKey.get("A")!.rating).toBeGreaterThan(byKey.get("B")!.rating);
    expect(byKey.get("B")!.rating).toBeGreaterThan(byKey.get("C")!.rating);
  });

  it("is not affected by input order", () => {
    const outcomes = [
      { winnerKey: "A", loserKey: "B" },
      { winnerKey: "A", loserKey: "C" },
      { winnerKey: "B", loserKey: "C" },
      { winnerKey: "C", loserKey: "A" },
      { winnerKey: "A", loserKey: "B" },
    ];
    const reversed = [...outcomes].reverse();

    const ratings = calculateBradleyTerryRatings(outcomes);
    const reversedRatings = calculateBradleyTerryRatings(reversed);
    const reversedByKey = new Map(reversedRatings.map((rating) => [rating.modelKey, rating]));

    for (const rating of ratings) {
      expect(rating.rating).toBeCloseTo(reversedByKey.get(rating.modelKey)!.rating, 8);
    }
  });

  it("tracks match, win, and loss counts", () => {
    const ratings = calculateBradleyTerryRatings([
      { winnerKey: "A", loserKey: "B" },
      { winnerKey: "A", loserKey: "B" },
      { winnerKey: "B", loserKey: "A" },
    ]);

    const byKey = new Map(ratings.map((rating) => [rating.modelKey, rating]));
    expect(byKey.get("A")).toMatchObject({ matchesPlayed: 3, wins: 2, losses: 1 });
    expect(byKey.get("B")).toMatchObject({ matchesPlayed: 3, wins: 1, losses: 2 });
  });
});
