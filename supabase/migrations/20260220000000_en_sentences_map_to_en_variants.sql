-- When user selects en-IN, en-US, en-UK or any en-* variant, also include sentences from "en" language.
-- This allows generic "en" sentences to be used for all English locale variants.

-- Add "en" as a generic English language if not present (sentences here are shared across en-* variants)
INSERT INTO public.languages (code, name, is_active)
VALUES ('en', 'English (generic)', true)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_random_sentence(
  p_language_id uuid,
  p_user_id uuid,
  p_exclude_window integer DEFAULT 10
)
RETURNS TABLE (id uuid, text text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH selected_lang AS (
    SELECT l.code
    FROM languages l
    WHERE l.id = p_language_id
  ),
  -- When selected language is en-*, also include the "en" language's id
  en_base_id AS (
    SELECT l.id
    FROM languages l
    WHERE l.code = 'en' AND l.is_active = true
    LIMIT 1
  ),
  -- Language IDs to consider: p_language_id + en (if selected is en-*)
  lang_ids AS (
    SELECT p_language_id AS lid
    UNION ALL
    SELECT e.id FROM en_base_id e
    WHERE EXISTS (SELECT 1 FROM selected_lang s WHERE s.code LIKE 'en-%')
  ),
  recent AS (
    SELECT te.sentence_id
    FROM test_events te
    WHERE te.user_id = p_user_id
    ORDER BY te.created_at DESC
    LIMIT p_exclude_window
  ),
  preferred AS (
    SELECT s.id, s.text
    FROM sentences s
    INNER JOIN lang_ids li ON li.lid = s.language_id
    WHERE s.is_active = true
      AND s.id NOT IN (SELECT sentence_id FROM recent)
  ),
  fallback AS (
    SELECT s.id, s.text
    FROM sentences s
    INNER JOIN lang_ids li ON li.lid = s.language_id
    WHERE s.is_active = true
  )
  SELECT id, text FROM (
    SELECT id, text, 1 AS ord FROM preferred
    UNION ALL
    SELECT id, text, 2 AS ord FROM fallback
  ) combined
  ORDER BY ord, random()
  LIMIT 1;
$$;
