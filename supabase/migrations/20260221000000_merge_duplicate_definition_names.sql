-- Merge duplicate ELO leaderboard entries caused by case-sensitive definition_name values.
-- Aliases (duplicates) are merged into canonical names; stats are combined with weighted avg for rating.

-- Step 1: Merge elo_ratings_global_model
WITH merge_mapping(alias, canonical) AS (
  VALUES
    ('inworld-tts-1.5-max'::text, 'Inworld TTS 1.5 Max'::text),
    ('inworld-tts-1.5-mini'::text, 'Inworld TTS 1.5 Mini'::text),
    ('sonic-turbo-2025-03-07'::text, 'Sonic Turbo'::text),
    ('tts-1'::text, 'TTS-1'::text),
    ('tts-1-hd'::text, 'TTS-1-HD'::text),
    ('gpt-4o-mini-tts-2025-12-15'::text, 'GPT-4o-Mini-TTS'::text)
),
alias_rows AS (
  SELECT e.provider_id, e.definition_name AS alias_def, m.canonical,
    e.rating AS alias_rating, e.matches_played AS alias_matches, e.wins AS alias_wins, e.losses AS alias_losses, e.last_updated AS alias_updated
  FROM public.elo_ratings_global_model e
  JOIN merge_mapping m ON m.alias = e.definition_name
),
merged_global AS (
  SELECT
    a.provider_id,
    a.canonical AS definition_name,
    CASE
      WHEN (a.alias_matches + COALESCE(c.matches_played, 0)) > 0 THEN
        (a.alias_rating * a.alias_matches + COALESCE(c.rating * c.matches_played, 0))::real /
        (a.alias_matches + COALESCE(c.matches_played, 0))
      ELSE 1500
    END AS rating,
    (a.alias_matches + COALESCE(c.matches_played, 0))::integer AS matches_played,
    (a.alias_wins + COALESCE(c.wins, 0))::integer AS wins,
    (a.alias_losses + COALESCE(c.losses, 0))::integer AS losses,
    GREATEST(a.alias_updated, COALESCE(c.last_updated, a.alias_updated)) AS last_updated
  FROM alias_rows a
  LEFT JOIN public.elo_ratings_global_model c
    ON c.provider_id = a.provider_id AND c.definition_name = a.canonical
)
INSERT INTO public.elo_ratings_global_model (provider_id, definition_name, rating, matches_played, wins, losses, last_updated)
SELECT provider_id, definition_name, rating, matches_played, wins, losses, last_updated
FROM merged_global
ON CONFLICT (provider_id, definition_name) DO UPDATE SET
  rating = EXCLUDED.rating,
  matches_played = EXCLUDED.matches_played,
  wins = EXCLUDED.wins,
  losses = EXCLUDED.losses,
  last_updated = EXCLUDED.last_updated;

DELETE FROM public.elo_ratings_global_model
WHERE definition_name IN (
  'inworld-tts-1.5-max', 'inworld-tts-1.5-mini', 'sonic-turbo-2025-03-07',
  'tts-1', 'tts-1-hd', 'gpt-4o-mini-tts-2025-12-15'
);

-- Step 2: Merge elo_ratings_by_language_model
WITH merge_mapping(alias, canonical) AS (
  VALUES
    ('inworld-tts-1.5-max'::text, 'Inworld TTS 1.5 Max'::text),
    ('inworld-tts-1.5-mini'::text, 'Inworld TTS 1.5 Mini'::text),
    ('sonic-turbo-2025-03-07'::text, 'Sonic Turbo'::text),
    ('tts-1'::text, 'TTS-1'::text),
    ('tts-1-hd'::text, 'TTS-1-HD'::text),
    ('gpt-4o-mini-tts-2025-12-15'::text, 'GPT-4o-Mini-TTS'::text)
),
alias_rows AS (
  SELECT e.provider_id, e.language_id, e.definition_name AS alias_def, m.canonical,
    e.rating AS alias_rating, e.matches_played AS alias_matches, e.wins AS alias_wins, e.losses AS alias_losses, e.last_updated AS alias_updated
  FROM public.elo_ratings_by_language_model e
  JOIN merge_mapping m ON m.alias = e.definition_name
),
merged_lang AS (
  SELECT
    a.provider_id,
    a.canonical AS definition_name,
    a.language_id,
    CASE
      WHEN (a.alias_matches + COALESCE(c.matches_played, 0)) > 0 THEN
        (a.alias_rating * a.alias_matches + COALESCE(c.rating * c.matches_played, 0))::real /
        (a.alias_matches + COALESCE(c.matches_played, 0))
      ELSE 1500
    END AS rating,
    (a.alias_matches + COALESCE(c.matches_played, 0))::integer AS matches_played,
    (a.alias_wins + COALESCE(c.wins, 0))::integer AS wins,
    (a.alias_losses + COALESCE(c.losses, 0))::integer AS losses,
    GREATEST(a.alias_updated, COALESCE(c.last_updated, a.alias_updated)) AS last_updated
  FROM alias_rows a
  LEFT JOIN public.elo_ratings_by_language_model c
    ON c.provider_id = a.provider_id AND c.definition_name = a.canonical AND c.language_id = a.language_id
)
INSERT INTO public.elo_ratings_by_language_model (provider_id, definition_name, language_id, rating, matches_played, wins, losses, last_updated)
SELECT provider_id, definition_name, language_id, rating, matches_played, wins, losses, last_updated
FROM merged_lang
ON CONFLICT (provider_id, definition_name, language_id) DO UPDATE SET
  rating = EXCLUDED.rating,
  matches_played = EXCLUDED.matches_played,
  wins = EXCLUDED.wins,
  losses = EXCLUDED.losses,
  last_updated = EXCLUDED.last_updated;

DELETE FROM public.elo_ratings_by_language_model
WHERE definition_name IN (
  'inworld-tts-1.5-max', 'inworld-tts-1.5-mini', 'sonic-turbo-2025-03-07',
  'tts-1', 'tts-1-hd', 'gpt-4o-mini-tts-2025-12-15'
);

-- Step 3: Update provider_model_definitions to use canonical names
UPDATE public.provider_model_definitions SET name = 'Inworld TTS 1.5 Max' WHERE name = 'inworld-tts-1.5-max';
UPDATE public.provider_model_definitions SET name = 'Inworld TTS 1.5 Mini' WHERE name = 'inworld-tts-1.5-mini';
UPDATE public.provider_model_definitions SET name = 'Sonic Turbo' WHERE name = 'sonic-turbo-2025-03-07';
UPDATE public.provider_model_definitions SET name = 'TTS-1' WHERE name = 'tts-1';
UPDATE public.provider_model_definitions SET name = 'TTS-1-HD' WHERE name = 'tts-1-hd';
UPDATE public.provider_model_definitions SET name = 'GPT-4o-Mini-TTS' WHERE name = 'gpt-4o-mini-tts-2025-12-15';

-- Step 4: Update models.name for consistency (fallback when no pmd match)
UPDATE public.models SET name = 'Inworld TTS 1.5 Max' WHERE name = 'inworld-tts-1.5-max';
UPDATE public.models SET name = 'Inworld TTS 1.5 Mini' WHERE name = 'inworld-tts-1.5-mini';
UPDATE public.models SET name = 'Sonic Turbo' WHERE name = 'sonic-turbo-2025-03-07';
UPDATE public.models SET name = 'TTS-1' WHERE name = 'tts-1';
UPDATE public.models SET name = 'TTS-1-HD' WHERE name = 'tts-1-hd';
UPDATE public.models SET name = 'GPT-4o-Mini-TTS' WHERE name = 'gpt-4o-mini-tts-2025-12-15';
