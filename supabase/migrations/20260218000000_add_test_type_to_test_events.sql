-- Add test_type column to test_events (PRD 12: Custom Tests)
-- Distinguishes blind tests (random A/B) from custom tests (user-picked A/B).

ALTER TABLE public.test_events
  ADD COLUMN test_type text NOT NULL DEFAULT 'blind'
  CHECK (test_type IN ('blind', 'custom'));

CREATE INDEX idx_test_events_test_type ON public.test_events(test_type);
