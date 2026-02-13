-- Add masked_preview to api_keys for display without decrypting
ALTER TABLE public.api_keys
ADD COLUMN IF NOT EXISTS masked_preview text;
