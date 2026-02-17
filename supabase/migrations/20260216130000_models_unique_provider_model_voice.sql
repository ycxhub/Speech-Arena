-- Allow multiple model × voice pairs per provider (e.g. ElevenLabs: same engine, different voices)
-- Old: UNIQUE(provider_id, model_id) - only one row per model
-- New: UNIQUE(provider_id, model_id, COALESCE(voice_id, '')) - one row per (model, voice) pair

ALTER TABLE public.models DROP CONSTRAINT IF EXISTS models_provider_id_model_id_key;

CREATE UNIQUE INDEX idx_models_provider_model_voice
ON public.models(provider_id, model_id, COALESCE(voice_id, ''));
