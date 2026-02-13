/**
 * Matchmaking Engine — prepares blind test rounds
 * PRD 08: Selects sentence + models, generates audio in parallel, creates test_event.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { generateAndStoreAudioPair } from "@/lib/tts";

const MAX_PREPARE_RETRIES = 3;
const RECENT_SENTENCE_WINDOW = 10;
const RECENT_PAIR_WINDOW = 20;

export interface PrepareNextRoundResult {
  testEventId: string;
  sentence: { id: string; text: string };
  audioA: { url: string };
  audioB: { url: string };
}

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
      // 1. Select sentence (exclude recently seen)
      const { data: recentSentences } = await supabase
        .from("test_events")
        .select("sentence_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_SENTENCE_WINDOW);
      const excludeIds = (recentSentences ?? []).map((r) => r.sentence_id);

      const { data: allSentences } = await supabase
        .from("sentences")
        .select("id, text")
        .eq("language_id", languageId)
        .eq("is_active", true);
      const pool = (allSentences ?? []).filter((s) => !excludeIds.includes(s.id));
      const sentencePool = pool.length > 0 ? pool : (allSentences ?? []);
      const finalSentence = sentencePool[Math.floor(Math.random() * sentencePool.length)];
      if (!finalSentence) throw new Error("No sentences available for this language");

      // 2. Get candidate models (active, same language, provider has API key)
      const { data: modelsWithKey } = await supabase
        .from("models")
        .select("id, gender, provider_id")
        .eq("is_active", true);
      const { data: providersWithKey } = await supabase
        .from("api_keys")
        .select("provider_id")
        .eq("status", "active");
      const providerIdsWithKey = new Set((providersWithKey ?? []).map((p) => p.provider_id));
      const { data: modelLangs } = await supabase
        .from("model_languages")
        .select("model_id")
        .eq("language_id", languageId);
      const langModelIds = new Set((modelLangs ?? []).map((m) => m.model_id));

      const eligibleModels = (modelsWithKey ?? []).filter(
        (m) => providerIdsWithKey.has(m.provider_id) && langModelIds.has(m.id)
      );
      if (eligibleModels.length < 2) throw new Error("Not enough models available for this language");

      // 3. Get recent pairs for anti-repeat
      const { data: recentEvents } = await supabase
        .from("test_events")
        .select("model_a_id, model_b_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_PAIR_WINDOW);
      const recentPairs = new Set(
        (recentEvents ?? []).map((e) => [e.model_a_id, e.model_b_id].sort().join(":"))
      );

      // 4. Select two models (same gender, prefer not recently paired)
      const modelA = eligibleModels[Math.floor(Math.random() * eligibleModels.length)]!;
      const sameGender = eligibleModels.filter((m) => m.gender === modelA.gender && m.id !== modelA.id);
      const modelBCandidates = sameGender.length > 0 ? sameGender : eligibleModels.filter((m) => m.id !== modelA.id);
      const avoidPair = modelBCandidates.filter((m) => !recentPairs.has([modelA.id, m.id].sort().join(":")));
      const modelBPool = avoidPair.length > 0 ? avoidPair : modelBCandidates;
      const modelB = modelBPool[Math.floor(Math.random() * modelBPool.length)];
      if (!modelB) throw new Error("Could not select second model");

      // 5. Randomize A/B
      const [modelAId, modelBId] = Math.random() < 0.5 ? [modelA.id, modelB.id] : [modelB.id, modelA.id];

      // 6. Generate audio in parallel
      const { audioA, audioB } = await generateAndStoreAudioPair(modelAId, modelBId, finalSentence.id);

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
