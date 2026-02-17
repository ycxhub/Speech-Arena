-- Fix: pick_random_voice_for_model must filter by gender so matchmaking same-gender constraint
-- is enforced at the voice level. Same (provider_id, model_id) can have multiple voices (male/female/neutral).

CREATE OR REPLACE FUNCTION public.pick_random_voice_for_model(
  p_provider_id uuid,
  p_model_id text,
  p_language_id uuid,
  p_gender text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id
  FROM models m
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  WHERE m.provider_id = p_provider_id
    AND m.model_id = p_model_id
    AND m.is_active = true
    AND (p_gender IS NULL OR m.gender = p_gender)
  ORDER BY random()
  LIMIT 1;
$$;
