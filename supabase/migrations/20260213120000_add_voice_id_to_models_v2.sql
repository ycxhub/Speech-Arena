-- Add voice_id to models (idempotent: skip if column already exists)
-- Provider has Model (TTS engine) and Voice (character) as separate attributes.
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS voice_id text;

COMMENT ON COLUMN public.models.model_id IS 'Provider-specific TTS model identifier (e.g. eleven_multilingual_v2, tts-1-hd)';
COMMENT ON COLUMN public.models.voice_id IS 'Provider-specific voice/character identifier (e.g. ElevenLabs voice ID). Optional; some providers derive from gender.';
