-- Model-level ELO tables (Phase 1)
-- Keyed by (provider_id, model_id) instead of models.id
-- One rating per TTS model (engine), aggregating across voices

-- Global model-level ELO
CREATE TABLE public.elo_ratings_global_model (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  rating real NOT NULL DEFAULT 1500,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, model_id)
);

COMMENT ON TABLE public.elo_ratings_global_model IS 'ELO ratings at model (TTS engine) level, not model-voice pair level';

-- Per-language model-level ELO
CREATE TABLE public.elo_ratings_by_language_model (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  rating real NOT NULL DEFAULT 1500,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, model_id, language_id)
);

COMMENT ON TABLE public.elo_ratings_by_language_model IS 'ELO ratings per language at model level';

-- Indexes for common queries
CREATE INDEX idx_elo_ratings_global_model_rating ON public.elo_ratings_global_model(rating DESC);
CREATE INDEX idx_elo_ratings_by_language_model_lang_rating ON public.elo_ratings_by_language_model(language_id, rating DESC);
