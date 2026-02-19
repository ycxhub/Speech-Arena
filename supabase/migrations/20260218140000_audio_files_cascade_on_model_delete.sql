-- Allow deleting models by cascading delete to audio_files (metadata only; R2 objects may remain)
ALTER TABLE public.audio_files
  DROP CONSTRAINT IF EXISTS audio_files_model_id_fkey;

ALTER TABLE public.audio_files
  ADD CONSTRAINT audio_files_model_id_fkey
  FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;
