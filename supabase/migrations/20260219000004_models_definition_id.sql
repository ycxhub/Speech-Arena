-- Phase 4: Add definition_id to models for reliable join to provider_model_definitions
-- Enables display of definition name without (provider_id, model_id) match

ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS definition_id uuid REFERENCES public.provider_model_definitions(id) ON DELETE SET NULL;

-- Backfill from (provider_id, model_id) match
UPDATE public.models m
SET definition_id = (
  SELECT pmd.id FROM public.provider_model_definitions pmd
  WHERE pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id
  LIMIT 1
)
WHERE m.definition_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_models_definition_id ON public.models(definition_id);

COMMENT ON COLUMN public.models.definition_id IS 'FK to provider_model_definitions for display name; backfilled from (provider_id, model_id)';
