-- Backfill model-level ELO from historical test_events (Phase 4)
-- Replays completed votes in chronological order, skips same-model pairs,
-- applies same ELO formula as process_vote.

-- Clear existing model-level ELO so we replay from scratch (idempotent backfill)
TRUNCATE public.elo_ratings_global_model CASCADE;
TRUNCATE public.elo_ratings_by_language_model CASCADE;

DO $$
DECLARE
  r RECORD;
  v_winner_provider_id uuid;
  v_winner_model_id text;
  v_loser_provider_id uuid;
  v_loser_model_id text;
  v_skipped integer := 0;
  v_processed integer := 0;
BEGIN
  FOR r IN
    SELECT te.id, te.winner_id, te.loser_id, te.language_id,
           COALESCE(te.listen_time_a_ms, 0)::integer AS listen_time_a_ms,
           COALESCE(te.listen_time_b_ms, 0)::integer AS listen_time_b_ms
    FROM public.test_events te
    WHERE te.status = 'completed'
      AND te.winner_id IS NOT NULL
      AND te.loser_id IS NOT NULL
    ORDER BY te.created_at ASC
  LOOP
    -- Resolve winner models.id -> (provider_id, model_id)
    SELECT provider_id, model_id INTO v_winner_provider_id, v_winner_model_id
    FROM public.models WHERE id = r.winner_id;

    -- Resolve loser models.id -> (provider_id, model_id)
    SELECT provider_id, model_id INTO v_loser_provider_id, v_loser_model_id
    FROM public.models WHERE id = r.loser_id;

    -- Skip if either model not found (deleted) or same model (different voices)
    IF v_winner_provider_id IS NULL OR v_winner_model_id IS NULL
       OR v_loser_provider_id IS NULL OR v_loser_model_id IS NULL THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    IF v_winner_provider_id = v_loser_provider_id AND v_winner_model_id = v_loser_model_id THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Apply ELO update (same logic as process_vote)
    PERFORM public.process_vote(
      r.id,
      r.winner_id,
      r.loser_id,
      r.language_id,
      r.listen_time_a_ms,
      r.listen_time_b_ms
    );
    v_processed := v_processed + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % processed, % skipped (same-model or missing)', v_processed, v_skipped;
END;
$$;
