-- Add model_id to provider_voices to link each voice to a model definition
ALTER TABLE public.provider_voices
  ADD COLUMN IF NOT EXISTS model_id text;

-- Backfill: set model_id from first model definition for provider (for existing voices)
UPDATE public.provider_voices pv
SET model_id = (
  SELECT model_id FROM public.provider_model_definitions
  WHERE provider_id = pv.provider_id
  ORDER BY created_at LIMIT 1
)
WHERE pv.model_id IS NULL;
