/**
 * Matchmaking Engine — prepares blind test rounds
 * PRD 08: Selects sentence + models, generates audio in parallel, creates test_event.
 *
 * Features: Balanced mode (80%) with ELO rating window, Exploration mode (20%) for
 * low-data models, constraint relaxation, provider.is_active filter.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { generateAndStoreAudioPair } from "@/lib/tts";

const MAX_PREPARE_RETRIES = 3;
const RECENT_SENTENCE_WINDOW = 10;
const RECENT_PAIR_WINDOW = 20;
const RELAXED_PAIR_WINDOW = 5;
const EXPLORATION_MODE_PROBABILITY = 0.2;
const LOW_DATA_MATCHES_THRESHOLD = 30;
const ELO_RATING_WINDOW_NARROW = 200;
const ELO_RATING_WINDOW_WIDE = 400;
const DEFAULT_ELO_RATING = 1500;

const NOT_ENOUGH_MODELS_ERROR =
  "Not enough models available for this language. Please try another language.";

export interface PrepareNextRoundResult {
  testEventId: string;
  sentence: { id: string; text: string };
  audioA: { url: string };
  audioB: { url: string };
}

type CandidateModel = {
  model_id: string;
  gender: string;
  rating: number;
  matches_played: number;
};

type RecentEvent = {
  sentence_id: string;
  model_a_id: string;
  model_b_id: string;
};

/**
 * Prepares the next blind test round for a user.
 * Generates audio in parallel; on failure retries with a new pair (up to 3 times).
 */
export async function prepareNextRound(params: {
  userId: string;
  languageId: string;
}): Promise<PrepareNextRoundResult> {
  const { userId, languageId } = params;
  const supabase = getAdminClient();

  for (let attempt = 0; attempt < MAX_PREPARE_RETRIES; attempt++) {
    try {
      // 1. Fetch data: candidates (with ELO), recent events, sentence
      const [candidatesResult, recentEventsResult, sentenceResult] = await Promise.all([
        supabase.rpc("get_matchmaking_candidates", { p_language_id: languageId }),
        supabase
          .from("test_events")
          .select("sentence_id, model_a_id, model_b_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(RECENT_PAIR_WINDOW),
        supabase.rpc("get_random_sentence", {
          p_language_id: languageId,
          p_user_id: userId,
          p_exclude_window: RECENT_SENTENCE_WINDOW,
        }),
      ]);

      const candidates = (candidatesResult.data ?? []) as CandidateModel[];
      const recentEvents = (recentEventsResult.data ?? []) as RecentEvent[];
      const sentenceRows = sentenceResult.data ?? [];

      if (candidates.length < 2) {
        throw new Error(NOT_ENOUGH_MODELS_ERROR);
      }

      const finalSentence = sentenceRows[0];
      if (!finalSentence) {
        throw new Error("No sentences available for this language");
      }

      // 2. Group candidates by gender (for same-gender constraint)
      const byGender = groupByGender(candidates);
      const gendersWithEnough = [...byGender.entries()].filter(
        ([_, models]) => models.length >= 2
      );

      if (gendersWithEnough.length === 0) {
        throw new Error(NOT_ENOUGH_MODELS_ERROR);
      }

      // 3. Mode selection: Exploration (20%) vs Balanced (80%)
      const useExploration =
        Math.random() < EXPLORATION_MODE_PROBABILITY &&
        candidates.some((c) => c.matches_played < LOW_DATA_MATCHES_THRESHOLD);

      // 4. Select models with constraint relaxation (4.1, 4.2): try window 20, then 5, then allow repeats
      let modelA: CandidateModel | null = null;
      let modelB: CandidateModel | null = null;
      for (const pairWindow of [RECENT_PAIR_WINDOW, RELAXED_PAIR_WINDOW, 0]) {
        const recentPairs =
          pairWindow > 0
            ? new Set(
                recentEvents
                  .slice(0, pairWindow)
                  .map((e) => [e.model_a_id, e.model_b_id].sort().join(":"))
              )
            : new Set<string>();

        const result = useExploration
          ? selectModelsExploration(candidates, byGender, gendersWithEnough, recentPairs)
          : selectModelsBalanced(candidates, byGender, gendersWithEnough, recentPairs);

        if (result.modelA && result.modelB) {
          modelA = result.modelA;
          modelB = result.modelB;
          break;
        }
      }

      if (!modelA || !modelB) {
        throw new Error("Could not select second model");
      }

      // 5. Randomize A/B ordering
      const [modelAId, modelBId] =
        Math.random() < 0.5 ? [modelA.model_id, modelB.model_id] : [modelB.model_id, modelA.model_id];

      // 6. Generate audio in parallel
      const { audioA, audioB } = await generateAndStoreAudioPair(
        modelAId,
        modelBId,
        finalSentence.id
      );

      // 7. Create test_event
      const { data: inserted, error } = await supabase
        .from("test_events")
        .insert({
          user_id: userId,
          sentence_id: finalSentence.id,
          language_id: languageId,
          model_a_id: modelAId,
          model_b_id: modelBId,
          audio_a_id: audioA.audioFileId,
          audio_b_id: audioB.audioFileId,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!inserted) throw new Error("Failed to create test event");

      return {
        testEventId: inserted.id,
        sentence: { id: finalSentence.id, text: finalSentence.text },
        audioA: { url: audioA.signedUrl },
        audioB: { url: audioB.signedUrl },
      };
    } catch (err) {
      if (attempt === MAX_PREPARE_RETRIES - 1) throw err;
      console.warn(`[Matchmaking] prepareNextRound attempt ${attempt + 1} failed, retrying:`, err);
    }
  }

  throw new Error("Failed to prepare round after retries");
}

function groupByGender(candidates: CandidateModel[]): Map<string, CandidateModel[]> {
  const map = new Map<string, CandidateModel[]>();
  for (const c of candidates) {
    const list = map.get(c.gender) ?? [];
    list.push(c);
    map.set(c.gender, list);
  }
  return map;
}

/**
 * Balanced mode: pick Model A from genders with ≥2 models; pick Model B within ELO window.
 */
function selectModelsBalanced(
  candidates: CandidateModel[],
  byGender: Map<string, CandidateModel[]>,
  gendersWithEnough: [string, CandidateModel[]][],
  recentPairs: Set<string>
): { modelA: CandidateModel | null; modelB: CandidateModel | null } {
  // Restrict Model A to genders that have ≥2 models (5.3)
  const modelAPool = gendersWithEnough.flatMap(([, models]) => models);
  const modelA = modelAPool[Math.floor(Math.random() * modelAPool.length)];
  if (!modelA) return { modelA: null, modelB: null };

  const sameGender = (byGender.get(modelA.gender) ?? []).filter((m) => m.model_id !== modelA.model_id);
  if (sameGender.length === 0) return { modelA: null, modelB: null };

  // ELO window: ±200, then ±400, then random
  const rating = modelA.rating ?? DEFAULT_ELO_RATING;
  const inNarrow = sameGender.filter(
    (m) => Math.abs((m.rating ?? DEFAULT_ELO_RATING) - rating) <= ELO_RATING_WINDOW_NARROW
  );
  const inWide = sameGender.filter(
    (m) => Math.abs((m.rating ?? DEFAULT_ELO_RATING) - rating) <= ELO_RATING_WINDOW_WIDE
  );
  const eloPool = inNarrow.length > 0 ? inNarrow : inWide.length > 0 ? inWide : sameGender;

  // Anti-repeat with constraint relaxation (4.1, 4.2)
  const avoidPairs = eloPool.filter(
    (m) => !recentPairs.has([modelA.model_id, m.model_id].sort().join(":"))
  );
  const modelBPool = avoidPairs.length > 0 ? avoidPairs : eloPool;

  const modelB = modelBPool[Math.floor(Math.random() * modelBPool.length)] ?? null;
  return { modelA, modelB };
}

/**
 * Exploration mode: pick Model A from low-data models; pick Model B preferring similar ELO.
 */
function selectModelsExploration(
  candidates: CandidateModel[],
  byGender: Map<string, CandidateModel[]>,
  gendersWithEnough: [string, CandidateModel[]][],
  recentPairs: Set<string>
): { modelA: CandidateModel | null; modelB: CandidateModel | null } {
  const lowData = candidates.filter((c) => c.matches_played < LOW_DATA_MATCHES_THRESHOLD);
  const modelAPool = lowData.length > 0 ? lowData : candidates;
  const modelA = modelAPool[Math.floor(Math.random() * modelAPool.length)];
  if (!modelA) return { modelA: null, modelB: null };

  const sameGender = (byGender.get(modelA.gender) ?? []).filter((m) => m.model_id !== modelA.model_id);
  if (sameGender.length === 0) return { modelA: null, modelB: null };

  // Prefer similar ELO for Model B
  const rating = modelA.rating ?? DEFAULT_ELO_RATING;
  const withSimilarRating = sameGender.filter(
    (m) => Math.abs((m.rating ?? DEFAULT_ELO_RATING) - rating) <= ELO_RATING_WINDOW_NARROW
  );
  const eloPool = withSimilarRating.length > 0 ? withSimilarRating : sameGender;

  const avoidPairs = eloPool.filter(
    (m) => !recentPairs.has([modelA.model_id, m.model_id].sort().join(":"))
  );
  const modelBPool = avoidPairs.length > 0 ? avoidPairs : eloPool;

  const modelB = modelBPool[Math.floor(Math.random() * modelBPool.length)] ?? null;
  return { modelA, modelB };
}
