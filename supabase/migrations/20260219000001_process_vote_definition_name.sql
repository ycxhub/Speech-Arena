-- process_vote: Use definition_name (provider_model_definitions.name) instead of model_id
-- Resolves models.id -> (provider_id, model_id) -> definition_name via provider_model_definitions
-- Fallback: models.name if present, else model_id (orphan models)

CREATE OR REPLACE FUNCTION public.process_vote(
  p_test_event_id uuid,
  p_winner_id uuid,
  p_loser_id uuid,
  p_language_id uuid,
  p_listen_time_a_ms integer,
  p_listen_time_b_ms integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_provider_id uuid;
  v_winner_model_id text;
  v_winner_definition_name text;
  v_loser_provider_id uuid;
  v_loser_model_id text;
  v_loser_definition_name text;
  v_winner_rating real;
  v_winner_matches integer;
  v_winner_wins integer;
  v_winner_losses integer;
  v_loser_rating real;
  v_loser_matches integer;
  v_loser_wins integer;
  v_loser_losses integer;
  v_winner_lang_rating real;
  v_winner_lang_matches integer;
  v_winner_lang_wins integer;
  v_winner_lang_losses integer;
  v_loser_lang_rating real;
  v_loser_lang_matches integer;
  v_loser_lang_wins integer;
  v_loser_lang_losses integer;
  v_k_winner integer;
  v_k_loser integer;
  v_k_winner_lang integer;
  v_k_loser_lang integer;
  v_expected_winner real;
  v_expected_loser real;
  v_expected_winner_lang real;
  v_expected_loser_lang real;
  v_winner_new_global real;
  v_loser_new_global real;
  v_winner_new_lang real;
  v_loser_new_lang real;
BEGIN
  -- Resolve winner models.id -> (provider_id, model_id) -> definition_name
  SELECT m.provider_id, m.model_id,
    COALESCE(pmd.name, NULLIF(TRIM(m.name), ''), m.model_id)
  INTO v_winner_provider_id, v_winner_model_id, v_winner_definition_name
  FROM public.models m
  LEFT JOIN public.provider_model_definitions pmd
    ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id
  WHERE m.id = p_winner_id;
  IF v_winner_provider_id IS NULL OR v_winner_model_id IS NULL OR v_winner_definition_name IS NULL THEN
    RAISE EXCEPTION 'Winner model not found: %', p_winner_id;
  END IF;

  -- Resolve loser models.id -> (provider_id, model_id) -> definition_name
  SELECT m.provider_id, m.model_id,
    COALESCE(pmd.name, NULLIF(TRIM(m.name), ''), m.model_id)
  INTO v_loser_provider_id, v_loser_model_id, v_loser_definition_name
  FROM public.models m
  LEFT JOIN public.provider_model_definitions pmd
    ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id
  WHERE m.id = p_loser_id;
  IF v_loser_provider_id IS NULL OR v_loser_model_id IS NULL OR v_loser_definition_name IS NULL THEN
    RAISE EXCEPTION 'Loser model not found: %', p_loser_id;
  END IF;

  -- Enforce: winner and loser must be different models (by definition_name)
  IF v_winner_provider_id = v_loser_provider_id AND v_winner_definition_name = v_loser_definition_name THEN
    RAISE EXCEPTION 'Winner and loser cannot be the same model (provider_id=%, definition_name=%)', v_winner_provider_id, v_winner_definition_name;
  END IF;

  -- Ensure elo_ratings_global_model rows exist (lazy init)
  INSERT INTO public.elo_ratings_global_model (provider_id, definition_name, rating, matches_played, wins, losses)
  VALUES (v_winner_provider_id, v_winner_definition_name, 1500, 0, 0, 0)
  ON CONFLICT (provider_id, definition_name) DO NOTHING;
  INSERT INTO public.elo_ratings_global_model (provider_id, definition_name, rating, matches_played, wins, losses)
  VALUES (v_loser_provider_id, v_loser_definition_name, 1500, 0, 0, 0)
  ON CONFLICT (provider_id, definition_name) DO NOTHING;

  -- Lock and fetch global ratings (lock in consistent order to prevent deadlocks)
  SELECT rating, matches_played, wins, losses INTO v_winner_rating, v_winner_matches, v_winner_wins, v_winner_losses
  FROM public.elo_ratings_global_model
  WHERE provider_id = v_winner_provider_id AND definition_name = v_winner_definition_name
  FOR UPDATE;

  SELECT rating, matches_played, wins, losses INTO v_loser_rating, v_loser_matches, v_loser_wins, v_loser_losses
  FROM public.elo_ratings_global_model
  WHERE provider_id = v_loser_provider_id AND definition_name = v_loser_definition_name
  FOR UPDATE;

  -- Fetch per-language ratings (lazy init with 1500 when no row exists)
  SELECT COALESCE(er.rating, 1500), COALESCE(er.matches_played, 0), COALESCE(er.wins, 0), COALESCE(er.losses, 0)
  INTO v_winner_lang_rating, v_winner_lang_matches, v_winner_lang_wins, v_winner_lang_losses
  FROM (SELECT 1) dummy
  LEFT JOIN public.elo_ratings_by_language_model er
    ON er.provider_id = v_winner_provider_id AND er.definition_name = v_winner_definition_name AND er.language_id = p_language_id;

  SELECT COALESCE(er.rating, 1500), COALESCE(er.matches_played, 0), COALESCE(er.wins, 0), COALESCE(er.losses, 0)
  INTO v_loser_lang_rating, v_loser_lang_matches, v_loser_lang_wins, v_loser_lang_losses
  FROM (SELECT 1) dummy
  LEFT JOIN public.elo_ratings_by_language_model er
    ON er.provider_id = v_loser_provider_id AND er.definition_name = v_loser_definition_name AND er.language_id = p_language_id;

  -- K-factor: 0-30 -> 40, 31-100 -> 20, 101+ -> 10
  v_k_winner := CASE WHEN v_winner_matches <= 30 THEN 40 WHEN v_winner_matches <= 100 THEN 20 ELSE 10 END;
  v_k_loser := CASE WHEN v_loser_matches <= 30 THEN 40 WHEN v_loser_matches <= 100 THEN 20 ELSE 10 END;
  v_k_winner_lang := CASE WHEN v_winner_lang_matches <= 30 THEN 40 WHEN v_winner_lang_matches <= 100 THEN 20 ELSE 10 END;
  v_k_loser_lang := CASE WHEN v_loser_lang_matches <= 30 THEN 40 WHEN v_loser_lang_matches <= 100 THEN 20 ELSE 10 END;

  -- ELO expected score: E = 1 / (1 + 10^((R_opponent - R_self) / 400))
  v_expected_winner := 1.0 / (1.0 + power(10.0, (v_loser_rating - v_winner_rating) / 400.0));
  v_expected_loser := 1.0 / (1.0 + power(10.0, (v_winner_rating - v_loser_rating) / 400.0));
  v_expected_winner_lang := 1.0 / (1.0 + power(10.0, (v_loser_lang_rating - v_winner_lang_rating) / 400.0));
  v_expected_loser_lang := 1.0 / (1.0 + power(10.0, (v_winner_lang_rating - v_loser_lang_rating) / 400.0));

  -- Rating update: R_new = R + K * (S - E)
  v_winner_new_global := v_winner_rating + v_k_winner * (1.0 - v_expected_winner);
  v_loser_new_global := v_loser_rating + v_k_loser * (0.0 - v_expected_loser);
  v_winner_new_lang := v_winner_lang_rating + v_k_winner_lang * (1.0 - v_expected_winner_lang);
  v_loser_new_lang := v_loser_lang_rating + v_k_loser_lang * (0.0 - v_expected_loser_lang);

  -- Update elo_ratings_global_model
  UPDATE public.elo_ratings_global_model
  SET rating = v_winner_new_global, matches_played = matches_played + 1, wins = wins + 1, last_updated = now()
  WHERE provider_id = v_winner_provider_id AND definition_name = v_winner_definition_name;
  UPDATE public.elo_ratings_global_model
  SET rating = v_loser_new_global, matches_played = matches_played + 1, losses = losses + 1, last_updated = now()
  WHERE provider_id = v_loser_provider_id AND definition_name = v_loser_definition_name;

  -- Upsert elo_ratings_by_language_model
  INSERT INTO public.elo_ratings_by_language_model (provider_id, definition_name, language_id, rating, matches_played, wins, losses)
  VALUES (v_winner_provider_id, v_winner_definition_name, p_language_id, v_winner_new_lang, v_winner_lang_matches + 1, v_winner_lang_wins + 1, v_winner_lang_losses)
  ON CONFLICT (provider_id, definition_name, language_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    matches_played = elo_ratings_by_language_model.matches_played + 1,
    wins = elo_ratings_by_language_model.wins + 1,
    last_updated = now();
  INSERT INTO public.elo_ratings_by_language_model (provider_id, definition_name, language_id, rating, matches_played, wins, losses)
  VALUES (v_loser_provider_id, v_loser_definition_name, p_language_id, v_loser_new_lang, v_loser_lang_matches + 1, v_loser_lang_wins, v_loser_lang_losses + 1)
  ON CONFLICT (provider_id, definition_name, language_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    matches_played = elo_ratings_by_language_model.matches_played + 1,
    losses = elo_ratings_by_language_model.losses + 1,
    last_updated = now();

  -- Update test_events with vote results and ELO snapshots
  UPDATE public.test_events
  SET
    winner_id = p_winner_id,
    loser_id = p_loser_id,
    listen_time_a_ms = p_listen_time_a_ms,
    listen_time_b_ms = p_listen_time_b_ms,
    status = 'completed',
    voted_at = now(),
    elo_before_winner = v_winner_rating,
    elo_before_loser = v_loser_rating,
    elo_after_winner = v_winner_new_global,
    elo_after_loser = v_loser_new_global
  WHERE id = p_test_event_id;
END;
$$;
