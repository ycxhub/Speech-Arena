-- Normalize English locale codes to canonical forms used by Amazon Polly and the app.
-- This updates any existing rows that may have been created with lowercase or non-canonical variants.

UPDATE public.languages
SET code = 'en-US'
WHERE code IN ('en-us', 'en_us')
ON CONFLICT (code) DO NOTHING;

UPDATE public.languages
SET code = 'en-IN'
WHERE code IN ('en-in', 'en_in')
ON CONFLICT (code) DO NOTHING;

UPDATE public.languages
SET code = 'en-GB'
WHERE code IN ('en-uk', 'en_uk', 'en-gb', 'en_gb')
ON CONFLICT (code) DO NOTHING;

