-- RPC: Return active languages that have at least p_min_count model-voice pairs
-- (same eligibility as matchmaking: model + provider_voices + model_languages + active provider + api key)

CREATE OR REPLACE FUNCTION public.get_active_languages_with_min_model_voices(p_min_count integer DEFAULT 5)
RETURNS TABLE (id uuid, name text, code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.name, l.code
  FROM languages l
  WHERE l.is_active = true
    AND (
      SELECT COUNT(*)::integer
      FROM models m
      INNER JOIN providers p ON p.id = m.provider_id AND p.is_active = true
      INNER JOIN provider_voices pv ON pv.provider_id = m.provider_id AND pv.voice_id = m.voice_id AND pv.language_id = l.id
      INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = l.id
      INNER JOIN (SELECT DISTINCT provider_id FROM api_keys WHERE status = 'active') ak ON ak.provider_id = p.id
      WHERE m.is_active = true
    ) >= p_min_count
  ORDER BY l.name;
$$;
