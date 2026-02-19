-- Hume AI TTS Provider Setup
-- Provider slug: hume (also hume-ai alias)
-- Model IDs: octave-1, octave-2
-- Endpoint: https://api.hume.ai/v0/tts/file
-- Auth: X-Hume-Api-Key header (https://dev.hume.ai/docs/introduction/api-key)
-- Voices: GET https://api.hume.ai/v0/tts/voices?provider=HUME_AI (Voice Library) or CUSTOM_VOICE

-- 1. Insert Hume provider
INSERT INTO public.providers (name, slug, base_url, is_active)
VALUES ('Hume AI', 'hume', 'https://api.hume.ai', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  updated_at = now();

-- 2. Model definitions (octave-1, octave-2)
INSERT INTO public.provider_model_definitions (provider_id, name, model_id, endpoint)
SELECT p.id, 'Octave 1', 'octave-1', 'https://api.hume.ai/v0/tts/file'
FROM public.providers p
WHERE p.slug = 'hume'
ON CONFLICT (provider_id, model_id) DO NOTHING;

INSERT INTO public.provider_model_definitions (provider_id, name, model_id, endpoint)
SELECT p.id, 'Octave 2', 'octave-2', 'https://api.hume.ai/v0/tts/file'
FROM public.providers p
WHERE p.slug = 'hume'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- 3. Provider languages (Octave 2: en, ja, ko, es, fr, pt, it, de, ru, hi, ar)
-- Add missing languages for Octave
INSERT INTO public.languages (code, name, is_active)
VALUES
  ('es-ES', 'Spanish (Spain)', true),
  ('ja-JP', 'Japanese', true),
  ('ko-KR', 'Korean', true),
  ('fr-FR', 'French (France)', true),
  ('de-DE', 'German', true),
  ('pt-BR', 'Portuguese (Brazil)', true),
  ('it-IT', 'Italian', true),
  ('ru-RU', 'Russian', true),
  ('ar-SA', 'Arabic', true)
ON CONFLICT (code) DO NOTHING;

-- Link Hume to supported languages
INSERT INTO public.provider_languages (provider_id, language_id)
SELECT p.id, l.id
FROM public.providers p
CROSS JOIN public.languages l
WHERE p.slug = 'hume'
  AND l.code IN (
    'en-US', 'en-IN', 'en-UK', 'hi-IN', 'es-ES', 'ja-JP', 'ko-KR',
    'fr-FR', 'de-DE', 'pt-BR', 'it-IT', 'ru-RU', 'ar-SA'
  )
ON CONFLICT (provider_id, language_id) DO NOTHING;
