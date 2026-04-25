import { NextResponse } from "next/server";
import { calculateBradleyTerryRatings } from "@/lib/elo/bradley-terry";
import { getAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

type TestEventOutcome = {
  winner_id: string | null;
  loser_id: string | null;
  language_id: string;
};

type ModelLookupRow = {
  id: string;
  definition_id: string | null;
  model_id: string;
  name: string;
  provider_id: string;
};

type DefinitionRow = {
  id: string;
  model_id: string;
  name: string;
  provider_id: string;
};

type RatingUpsertRow = {
  provider_id: string;
  definition_name: string;
  beta: number;
  rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  last_updated: string;
};

type LanguageRatingUpsertRow = RatingUpsertRow & {
  language_id: string;
};

const PAGE_SIZE = 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [events, models, definitions] = await Promise.all([
      fetchCompletedBlindOutcomes(),
      fetchModelLookupRows(),
      fetchDefinitionRows(),
    ]);

    const modelToKey = buildModelKeyMap(models, definitions);
    const activeModelKeys = Array.from(new Set(models.map((model) => modelToKey.get(model.id)).filter(Boolean) as string[]));
    const globalOutcomes: { winnerKey: string; loserKey: string }[] = [];
    const outcomesByLanguage = new Map<string, { winnerKey: string; loserKey: string }[]>();
    let skippedEvents = 0;

    for (const event of events) {
      if (!event.winner_id || !event.loser_id) continue;

      const winnerKey = modelToKey.get(event.winner_id);
      const loserKey = modelToKey.get(event.loser_id);

      if (!winnerKey || !loserKey || winnerKey === loserKey) {
        skippedEvents++;
        continue;
      }

      const outcome = { winnerKey, loserKey };
      globalOutcomes.push(outcome);

      const languageOutcomes = outcomesByLanguage.get(event.language_id) ?? [];
      languageOutcomes.push(outcome);
      outcomesByLanguage.set(event.language_id, languageOutcomes);
    }

    const refreshedAt = new Date().toISOString();
    const globalRows = calculateBradleyTerryRatings(globalOutcomes, {
      modelKeys: activeModelKeys,
    }).map((rating) => toGlobalRow(rating, refreshedAt));

    const languageRows: LanguageRatingUpsertRow[] = [];
    for (const [languageId, outcomes] of outcomesByLanguage) {
      languageRows.push(
        ...calculateBradleyTerryRatings(outcomes).map((rating) =>
          toLanguageRow(rating, languageId, refreshedAt)
        )
      );
    }

    await replaceRatings(globalRows, languageRows);

    return NextResponse.json({
      ok: true,
      eventsCount: events.length,
      skippedEvents,
      globalRatingsCount: globalRows.length,
      languageRatingsCount: languageRows.length,
      refreshedAt,
    });
  } catch (err) {
    console.error("[Bradley-Terry refresh failed]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bradley-Terry refresh failed" },
      { status: 500 }
    );
  }
}

async function fetchCompletedBlindOutcomes(): Promise<TestEventOutcome[]> {
  const admin = getAdminClient();
  const rows: TestEventOutcome[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("test_events")
      .select("winner_id, loser_id, language_id")
      .eq("status", "completed")
      .eq("test_type", "blind")
      .not("winner_id", "is", null)
      .not("loser_id", "is", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchModelLookupRows(): Promise<ModelLookupRow[]> {
  const admin = getAdminClient();
  const rows: ModelLookupRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("models")
      .select("id, definition_id, model_id, name, provider_id")
      .eq("is_active", true)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchDefinitionRows(): Promise<DefinitionRow[]> {
  const admin = getAdminClient();
  const rows: DefinitionRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("provider_model_definitions")
      .select("id, model_id, name, provider_id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

function buildModelKeyMap(models: ModelLookupRow[], definitions: DefinitionRow[]) {
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const definitionByProviderModel = new Map(
    definitions.map((definition) => [`${definition.provider_id}:${definition.model_id}`, definition])
  );

  return new Map(
    models.map((model) => {
      const definition =
        (model.definition_id ? definitionById.get(model.definition_id) : undefined) ??
        definitionByProviderModel.get(`${model.provider_id}:${model.model_id}`);
      const fallbackName = model.name.trim() || model.model_id;
      const definitionName = definition?.name ?? fallbackName;
      return [model.id, `${model.provider_id}:${definitionName}`];
    })
  );
}

function toGlobalRow(
  rating: ReturnType<typeof calculateBradleyTerryRatings>[number],
  refreshedAt: string
): RatingUpsertRow {
  const { providerId, definitionName } = splitModelKey(rating.modelKey);
  return {
    provider_id: providerId,
    definition_name: definitionName,
    beta: rating.beta,
    rating: rating.rating,
    matches_played: rating.matchesPlayed,
    wins: rating.wins,
    losses: rating.losses,
    last_updated: refreshedAt,
  };
}

function toLanguageRow(
  rating: ReturnType<typeof calculateBradleyTerryRatings>[number],
  languageId: string,
  refreshedAt: string
): LanguageRatingUpsertRow {
  return {
    ...toGlobalRow(rating, refreshedAt),
    language_id: languageId,
  };
}

function splitModelKey(modelKey: string) {
  const separatorIndex = modelKey.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error(`Invalid Bradley-Terry model key: ${modelKey}`);
  }

  return {
    providerId: modelKey.slice(0, separatorIndex),
    definitionName: modelKey.slice(separatorIndex + 1),
  };
}

async function replaceRatings(
  globalRows: RatingUpsertRow[],
  languageRows: LanguageRatingUpsertRow[]
) {
  const admin = getAdminClient();

  if (globalRows.length > 0) {
    const { error } = await admin
      .from("bradley_terry_ratings_global_model")
      .upsert(globalRows, { onConflict: "provider_id,definition_name" });
    if (error) throw new Error(error.message);
  }

  if (languageRows.length > 0) {
    const { error } = await admin
      .from("bradley_terry_ratings_by_language_model")
      .upsert(languageRows, { onConflict: "provider_id,definition_name,language_id" });
    if (error) throw new Error(error.message);
  }

  await deleteStaleGlobalRows(globalRows);
  await deleteStaleLanguageRows(languageRows);
}

async function deleteStaleGlobalRows(rows: RatingUpsertRow[]) {
  const admin = getAdminClient();
  const currentKeys = new Set(rows.map((row) => `${row.provider_id}:${row.definition_name}`));
  const { data, error } = await admin
    .from("bradley_terry_ratings_global_model")
    .select("provider_id, definition_name");

  if (error) throw new Error(error.message);

  await Promise.all(
    (data ?? [])
      .filter((row) => !currentKeys.has(`${row.provider_id}:${row.definition_name}`))
      .map((row) =>
        admin
          .from("bradley_terry_ratings_global_model")
          .delete()
          .eq("provider_id", row.provider_id)
          .eq("definition_name", row.definition_name)
          .then(({ error: deleteError }) => {
            if (deleteError) throw new Error(deleteError.message);
          })
      )
  );
}

async function deleteStaleLanguageRows(rows: LanguageRatingUpsertRow[]) {
  const admin = getAdminClient();
  const currentKeys = new Set(
    rows.map((row) => `${row.provider_id}:${row.definition_name}:${row.language_id}`)
  );
  const { data, error } = await admin
    .from("bradley_terry_ratings_by_language_model")
    .select("provider_id, definition_name, language_id");

  if (error) throw new Error(error.message);

  await Promise.all(
    (data ?? [])
      .filter((row) => !currentKeys.has(`${row.provider_id}:${row.definition_name}:${row.language_id}`))
      .map((row) =>
        admin
          .from("bradley_terry_ratings_by_language_model")
          .delete()
          .eq("provider_id", row.provider_id)
          .eq("definition_name", row.definition_name)
          .eq("language_id", row.language_id)
          .then(({ error: deleteError }) => {
            if (deleteError) throw new Error(deleteError.message);
          })
      )
  );
}
