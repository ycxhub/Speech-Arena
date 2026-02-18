-- Seed predefined languages if missing (en-US, en-IN, en-UK, hi-IN, Multilingual, Codemixed)
INSERT INTO public.languages (code, name, is_active)
VALUES
  ('en-US', 'en-US', true),
  ('en-IN', 'en-IN', true),
  ('en-UK', 'en-UK', true),
  ('hi-IN', 'hi-IN', true),
  ('Multilingual', 'Multilingual', true),
  ('Codemixed', 'Codemixed', true)
ON CONFLICT (code) DO NOTHING;
