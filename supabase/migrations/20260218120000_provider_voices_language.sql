-- Add mandatory language_id to provider_voices (voice must be tagged with a language/locale)
ALTER TABLE public.provider_voices
  ADD COLUMN IF NOT EXISTS language_id uuid REFERENCES public.languages(id) ON DELETE RESTRICT;

-- Backfill: set language_id to first active language for existing voices
UPDATE public.provider_voices pv
SET language_id = sub.id
FROM (SELECT id FROM public.languages WHERE is_active = true ORDER BY code LIMIT 1) sub
WHERE pv.language_id IS NULL;

-- Make NOT NULL after backfill (only if all rows have language_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.provider_voices WHERE language_id IS NULL) THEN
    ALTER TABLE public.provider_voices ALTER COLUMN language_id SET NOT NULL;
  END IF;
END $$;
