-- LnL On-the-Fly TTS Generation
-- Allow null audio_url for items pending TTS generation
-- Add lnl_tts_generations table for cost tracking

-- Allow null audio_url for items pending TTS generation
ALTER TABLE public.lnl_task_items
  ALTER COLUMN audio_url DROP NOT NULL;

-- Cost tracking for LnL TTS generations
CREATE TABLE public.lnl_tts_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.lnl_tasks(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.lnl_task_items(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  characters_generated int NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10, 6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lnl_tts_generations_task ON public.lnl_tts_generations(task_id);
CREATE INDEX idx_lnl_tts_generations_created ON public.lnl_tts_generations(created_at);

-- RLS for lnl_tts_generations
ALTER TABLE public.lnl_tts_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LNL admins can read TTS generations"
  ON public.lnl_tts_generations FOR SELECT
  USING (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can insert TTS generations"
  ON public.lnl_tts_generations FOR INSERT
  WITH CHECK (public.is_lnl_admin(auth.uid()));
