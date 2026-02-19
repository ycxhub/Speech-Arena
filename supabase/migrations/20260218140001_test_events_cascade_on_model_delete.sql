-- Allow deleting models by cascading delete to test_events (battle history involving that model)
ALTER TABLE public.test_events
  DROP CONSTRAINT IF EXISTS test_events_model_a_id_fkey,
  DROP CONSTRAINT IF EXISTS test_events_model_b_id_fkey,
  DROP CONSTRAINT IF EXISTS test_events_winner_id_fkey,
  DROP CONSTRAINT IF EXISTS test_events_loser_id_fkey;

ALTER TABLE public.test_events
  ADD CONSTRAINT test_events_model_a_id_fkey
  FOREIGN KEY (model_a_id) REFERENCES public.models(id) ON DELETE CASCADE,
  ADD CONSTRAINT test_events_model_b_id_fkey
  FOREIGN KEY (model_b_id) REFERENCES public.models(id) ON DELETE CASCADE,
  ADD CONSTRAINT test_events_winner_id_fkey
  FOREIGN KEY (winner_id) REFERENCES public.models(id) ON DELETE SET NULL,
  ADD CONSTRAINT test_events_loser_id_fkey
  FOREIGN KEY (loser_id) REFERENCES public.models(id) ON DELETE SET NULL;
