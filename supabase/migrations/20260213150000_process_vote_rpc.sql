-- process_vote RPC: atomic ELO update on vote (PRD 10)
-- Performs all updates in a single transaction with row-level locking.

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
  r RECORD;
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
  -- Ensure elo_ratings_global rows exist (backfill edge case)
  INSERT INTO public.elo_ratings_global (model_id, rating, matches_played, wins, losses)
  VALUES (p_winner_id, 1500, 0, 0, 0)
  ON CONFLICT (model_id) DO NOTHING;
  INSERT INTO public.elo_ratings_global (model_id, rating, matches_played, wins, losses)
  VALUES (p_loser_id, 1500, 0, 0, 0)
  ON CONFLICT (model_id) DO NOTHING;

  -- Lock rows in consistent order (by model_id) to prevent deadlocks
  FOR r IN
    SELECT model_id, rating, matches_played, wins, losses
    FROM public.elo_ratings_global
    WHERE model_id IN (p_winner_id, p_loser_id)
    ORDER BY model_id
    FOR UPDATE
  LOOP
    IF r.model_id = p_winner_id THEN
      v_winner_rating := r.rating;
      v_winner_matches := r.matches_played;
      v_winner_wins := r.wins;
      v_winner_losses := r.losses;
    ELSE
      v_loser_rating := r.rating;
      v_loser_matches := r.matches_played;
      v_loser_wins := r.wins;
      v_loser_losses := r.losses;
    END IF;
  END LOOP;

  -- Fetch per-language ratings (use 1500, 0 if no row exists - lazy init)
  SELECT COALESCE(er.rating, 1500), COALESCE(er.matches_played, 0), COALESCE(er.wins, 0), COALESCE(er.losses, 0)
  INTO v_winner_lang_rating, v_winner_lang_matches, v_winner_lang_wins, v_winner_lang_losses
  FROM (SELECT p_winner_id AS mid, p_language_id AS lid) p
  LEFT JOIN public.elo_ratings_by_language er ON er.model_id = p.mid AND er.language_id = p.lid;
  SELECT COALESCE(er.rating, 1500), COALESCE(er.matches_played, 0), COALESCE(er.wins, 0), COALESCE(er.losses, 0)
  INTO v_loser_lang_rating, v_loser_lang_matches, v_loser_lang_wins, v_loser_lang_losses
  FROM (SELECT p_loser_id AS mid, p_language_id AS lid) p
  LEFT JOIN public.elo_ratings_by_language er ON er.model_id = p.mid AND er.language_id = p.lid;

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

  -- Rating update: R_new = R + K * (S - E), winner S=1, loser S=0
  v_winner_new_global := v_winner_rating + v_k_winner * (1.0 - v_expected_winner);
  v_loser_new_global := v_loser_rating + v_k_loser * (0.0 - v_expected_loser);
  v_winner_new_lang := v_winner_lang_rating + v_k_winner_lang * (1.0 - v_expected_winner_lang);
  v_loser_new_lang := v_loser_lang_rating + v_k_loser_lang * (0.0 - v_expected_loser_lang);

  -- Update elo_ratings_global for both models
  UPDATE public.elo_ratings_global
  SET rating = v_winner_new_global, matches_played = matches_played + 1, wins = wins + 1, last_updated = now()
  WHERE model_id = p_winner_id;
  UPDATE public.elo_ratings_global
  SET rating = v_loser_new_global, matches_played = matches_played + 1, losses = losses + 1, last_updated = now()
  WHERE model_id = p_loser_id;

  -- Upsert elo_ratings_by_language (lazy create with 1500 when no row exists)
  INSERT INTO public.elo_ratings_by_language (model_id, language_id, rating, matches_played, wins, losses)
  VALUES (p_winner_id, p_language_id, v_winner_new_lang, v_winner_lang_matches + 1, v_winner_lang_wins + 1, v_winner_lang_losses)
  ON CONFLICT (model_id, language_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    matches_played = elo_ratings_by_language.matches_played + 1,
    wins = elo_ratings_by_language.wins + 1,
    last_updated = now();
  INSERT INTO public.elo_ratings_by_language (model_id, language_id, rating, matches_played, wins, losses)
  VALUES (p_loser_id, p_language_id, v_loser_new_lang, v_loser_lang_matches + 1, v_loser_lang_wins, v_loser_lang_losses + 1)
  ON CONFLICT (model_id, language_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    matches_played = elo_ratings_by_language.matches_played + 1,
    losses = elo_ratings_by_language.losses + 1,
    last_updated = now();

  -- Update test_events with vote results and ELO snapshots (global ratings)
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
