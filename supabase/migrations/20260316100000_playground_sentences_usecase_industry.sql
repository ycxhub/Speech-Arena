-- Add usecase and industry columns to playground_sample_sentences
-- Required for CSV bulk upload and industry filtering on the frontend

ALTER TABLE public.playground_sample_sentences
  ADD COLUMN IF NOT EXISTS usecase text,
  ADD COLUMN IF NOT EXISTS industry text;

-- Optional: backfill existing rows with default industry for backward compatibility
-- UPDATE public.playground_sample_sentences SET industry = 'Customer Support' WHERE industry IS NULL;
