-- Enable pgcrypto for UUID generation and API key encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table (must exist before handle_new_user trigger)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, created_at, updated_at)
  VALUES (new.id, new.email, NULL, 'user', now(), now());
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Languages
CREATE TABLE public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sentences
CREATE TABLE public.sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid NOT NULL REFERENCES public.languages(id),
  text text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sentence versions (history tracking)
CREATE TABLE public.sentence_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id uuid NOT NULL REFERENCES public.sentences(id) ON DELETE CASCADE,
  text text NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Providers
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  base_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Models (voices/models per provider)
CREATE TABLE public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  model_id text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'neutral')),
  tags text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, model_id)
);

-- Model languages (junction: which models support which languages)
CREATE TABLE public.model_languages (
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  PRIMARY KEY (model_id, language_id)
);

-- API keys (encrypted, admin-only)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  encrypted_key text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audio files (metadata for R2-stored audio)
CREATE TABLE public.audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.models(id),
  sentence_id uuid NOT NULL REFERENCES public.sentences(id),
  r2_key text NOT NULL UNIQUE,
  file_size_bytes integer,
  duration_ms integer,
  generation_latency_ms integer,
  provider_request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (model_id, sentence_id)
);

-- Test events (core battle log)
CREATE TABLE public.test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  sentence_id uuid NOT NULL REFERENCES public.sentences(id),
  language_id uuid NOT NULL REFERENCES public.languages(id),
  model_a_id uuid NOT NULL REFERENCES public.models(id),
  model_b_id uuid NOT NULL REFERENCES public.models(id),
  audio_a_id uuid NOT NULL REFERENCES public.audio_files(id),
  audio_b_id uuid NOT NULL REFERENCES public.audio_files(id),
  winner_id uuid REFERENCES public.models(id),
  loser_id uuid REFERENCES public.models(id),
  listen_time_a_ms integer,
  listen_time_b_ms integer,
  is_valid boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'invalid')),
  elo_before_winner real,
  elo_before_loser real,
  elo_after_winner real,
  elo_after_loser real,
  generation_cost real,
  created_at timestamptz NOT NULL DEFAULT now(),
  voted_at timestamptz
);

-- ELO ratings (global)
CREATE TABLE public.elo_ratings_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL UNIQUE REFERENCES public.models(id) ON DELETE CASCADE,
  rating real NOT NULL DEFAULT 1500,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- ELO ratings (per language)
CREATE TABLE public.elo_ratings_by_language (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  rating real NOT NULL DEFAULT 1500,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (model_id, language_id)
);

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_test_events_user_id ON public.test_events(user_id);
CREATE INDEX idx_test_events_language_id ON public.test_events(language_id);
CREATE INDEX idx_test_events_created_at ON public.test_events(created_at);
CREATE INDEX idx_test_events_model_a_id ON public.test_events(model_a_id);
CREATE INDEX idx_test_events_model_b_id ON public.test_events(model_b_id);
CREATE INDEX idx_test_events_winner_id ON public.test_events(winner_id);
CREATE INDEX idx_sentences_language_id_is_active ON public.sentences(language_id, is_active);
CREATE INDEX idx_models_provider_id_is_active ON public.models(provider_id, is_active);
CREATE INDEX idx_elo_ratings_global_rating_desc ON public.elo_ratings_global(rating DESC);
CREATE INDEX idx_elo_ratings_by_language_language_rating ON public.elo_ratings_by_language(language_id, rating DESC);
CREATE INDEX idx_admin_audit_log_admin_created ON public.admin_audit_log(admin_id, created_at);

-- Row-Level Security: enable on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentence_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_ratings_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_ratings_by_language ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: profiles
CREATE POLICY "Users can select own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can select all profiles" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own display_name" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user');
CREATE POLICY "Admins can update any role" ON public.profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: languages
CREATE POLICY "Authenticated users can select active languages" ON public.languages FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admins can select all languages" ON public.languages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage languages" ON public.languages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: sentences
CREATE POLICY "Authenticated users can select active sentences" ON public.sentences FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admins can select all sentences" ON public.sentences FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage sentences" ON public.sentences FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: sentence_versions
CREATE POLICY "Admins can select sentence_versions" ON public.sentence_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert sentence_versions" ON public.sentence_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS: providers
CREATE POLICY "Authenticated users can select active providers" ON public.providers FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admins can select all providers" ON public.providers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage providers" ON public.providers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: models
CREATE POLICY "Authenticated users can select active models" ON public.models FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admins can select all models" ON public.models FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage models" ON public.models FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: model_languages
CREATE POLICY "Authenticated users can select model_languages" ON public.model_languages FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins can manage model_languages" ON public.model_languages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: api_keys (admin only)
CREATE POLICY "Admins can manage api_keys" ON public.api_keys FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: audio_files (authenticated SELECT; service role INSERT only - no policy = deny for anon/auth)
CREATE POLICY "Authenticated users can select audio_files" ON public.audio_files FOR SELECT TO authenticated
  USING (true);

-- RLS: test_events
CREATE POLICY "Users can select own test_events" ON public.test_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can select all test_events" ON public.test_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- Service role handles INSERT/UPDATE (bypasses RLS)

-- RLS: elo_ratings_global
CREATE POLICY "Authenticated users can select elo_ratings_global" ON public.elo_ratings_global FOR SELECT TO authenticated
  USING (true);
-- Service role handles INSERT/UPDATE

-- RLS: elo_ratings_by_language
CREATE POLICY "Authenticated users can select elo_ratings_by_language" ON public.elo_ratings_by_language FOR SELECT TO authenticated
  USING (true);
-- Service role handles INSERT/UPDATE

-- RLS: admin_audit_log
CREATE POLICY "Admins can select admin_audit_log" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- Service role handles INSERT
