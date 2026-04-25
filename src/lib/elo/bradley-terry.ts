export type BradleyTerryOutcome = {
  winnerKey: string;
  loserKey: string;
};

export type BradleyTerryRating = {
  modelKey: string;
  beta: number;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
};

export type BradleyTerryOptions = {
  anchor?: number;
  maxIterations?: number;
  modelKeys?: string[];
  tolerance?: number;
  priorStrength?: number;
};

const DEFAULT_ANCHOR = 1000;
const ELO_SCALE = 400 / Math.log(10);
const MIN_ABILITY = 1e-9;

export function betaToElo(beta: number, anchor = DEFAULT_ANCHOR): number {
  return anchor + ELO_SCALE * beta;
}

/**
 * Fits Bradley-Terry abilities with Hunter's MM update.
 *
 * A small symmetric prior keeps ratings finite for sparse historical graphs
 * where exact MLE would otherwise diverge for undefeated or winless models.
 */
export function calculateBradleyTerryRatings(
  outcomes: BradleyTerryOutcome[],
  options: BradleyTerryOptions = {}
): BradleyTerryRating[] {
  const anchor = options.anchor ?? DEFAULT_ANCHOR;
  const maxIterations = options.maxIterations ?? 1000;
  const tolerance = options.tolerance ?? 1e-10;
  const priorStrength = options.priorStrength ?? 0.5;

  const keys = new Set(options.modelKeys ?? []);
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const pairCounts = new Map<string, Map<string, number>>();

  for (const outcome of outcomes) {
    if (outcome.winnerKey === outcome.loserKey) continue;

    keys.add(outcome.winnerKey);
    keys.add(outcome.loserKey);
    wins.set(outcome.winnerKey, (wins.get(outcome.winnerKey) ?? 0) + 1);
    losses.set(outcome.loserKey, (losses.get(outcome.loserKey) ?? 0) + 1);

    addPairCount(pairCounts, outcome.winnerKey, outcome.loserKey);
    addPairCount(pairCounts, outcome.loserKey, outcome.winnerKey);
  }

  const modelKeys = Array.from(keys).sort();
  if (modelKeys.length === 0) return [];

  const ability = new Map(modelKeys.map((key) => [key, 1]));

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let maxChange = 0;
    const nextAbility = new Map<string, number>();

    for (const key of modelKeys) {
      const currentWins = wins.get(key) ?? 0;
      let denominator = 0;

      for (const [opponentKey, comparisons] of pairCounts.get(key) ?? []) {
        const ownAbility = ability.get(key) ?? 1;
        const opponentAbility = ability.get(opponentKey) ?? 1;
        denominator += comparisons / (ownAbility + opponentAbility);
      }

      const updated =
        denominator > 0
          ? (currentWins + priorStrength) / (denominator + priorStrength)
          : 1;
      const bounded = Math.max(updated, MIN_ABILITY);
      nextAbility.set(key, bounded);
      maxChange = Math.max(maxChange, Math.abs(bounded - (ability.get(key) ?? 1)));
    }

    normalizeAbilities(nextAbility);
    ability.clear();
    for (const [key, value] of nextAbility) ability.set(key, value);

    if (maxChange < tolerance) break;
  }

  const betaByKey = new Map(modelKeys.map((key) => [key, Math.log(ability.get(key) ?? 1)]));
  const meanBeta =
    Array.from(betaByKey.values()).reduce((sum, beta) => sum + beta, 0) / modelKeys.length;

  return modelKeys
    .map((modelKey) => {
      const beta = (betaByKey.get(modelKey) ?? 0) - meanBeta;
      const modelWins = wins.get(modelKey) ?? 0;
      const modelLosses = losses.get(modelKey) ?? 0;
      return {
        modelKey,
        beta,
        rating: betaToElo(beta, anchor),
        matchesPlayed: modelWins + modelLosses,
        wins: modelWins,
        losses: modelLosses,
      };
    })
    .sort((a, b) => b.rating - a.rating || a.modelKey.localeCompare(b.modelKey));
}

function addPairCount(
  pairCounts: Map<string, Map<string, number>>,
  modelKey: string,
  opponentKey: string
) {
  let opponentCounts = pairCounts.get(modelKey);
  if (!opponentCounts) {
    opponentCounts = new Map();
    pairCounts.set(modelKey, opponentCounts);
  }
  opponentCounts.set(opponentKey, (opponentCounts.get(opponentKey) ?? 0) + 1);
}

function normalizeAbilities(ability: Map<string, number>) {
  const values = Array.from(ability.values());
  const geometricMean = Math.exp(
    values.reduce((sum, value) => sum + Math.log(Math.max(value, MIN_ABILITY)), 0) /
      values.length
  );

  if (!Number.isFinite(geometricMean) || geometricMean <= 0) return;

  for (const [key, value] of ability) {
    ability.set(key, value / geometricMean);
  }
}
