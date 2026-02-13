-- Backfill elo_ratings_global for existing models that don't have a row (PRD 10)
INSERT INTO public.elo_ratings_global (model_id, rating, matches_played, wins, losses)
SELECT m.id, 1500::real, 0, 0, 0
FROM public.models m
WHERE NOT EXISTS (
  SELECT 1 FROM public.elo_ratings_global e WHERE e.model_id = m.id
);
