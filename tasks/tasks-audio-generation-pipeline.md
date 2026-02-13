# Tasks: TTS Audio Generation Pipeline

Based on [PRD 07: TTS Audio Generation Pipeline](../tasks/prd-audio-generation-pipeline.md).

## Relevant Files

- `src/lib/tts/types.ts` - TTSGenerationResult and TTSProviderAdapter interfaces.
- `src/lib/tts/registry.ts` - Provider registry mapping slugs to adapters.
- `src/lib/tts/providers/elevenlabs.ts` - ElevenLabs TTS provider adapter.
- `src/lib/tts/providers/openai-tts.ts` - OpenAI TTS provider adapter.
- `src/lib/tts/providers/google-cloud-tts.ts` - Google Cloud TTS adapter (stub).
- `src/lib/tts/providers/amazon-polly.ts` - Amazon Polly adapter (stub).
- `src/lib/tts/providers/azure-tts.ts` - Azure TTS adapter (stub).
- `src/lib/tts/retry.ts` - Retry wrapper with exponential backoff.
- `src/lib/tts/circuit-breaker.ts` - Simple circuit breaker for provider failures.
- `src/lib/tts/generate.ts` - Main generateAndStoreAudio function.
- `src/lib/crypto/keys.ts` - decryptApiKey and getActiveApiKey utilities.
- `src/lib/supabase/admin.ts` - Service role client for bypassing RLS.
- `src/lib/r2/storage.ts` - Existing uploadAudio, getSignedUrl (already implemented).
- `.env.local.example` - Document API_KEY_ENCRYPTION_SECRET.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests.
- The project uses Supabase service role for audio_files INSERT (bypasses RLS).
- Provider adapters: ElevenLabs and OpenAI implemented; others created as stubs for future completion.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/07-audio-generation-pipeline`

- [x] 1.0 TTS types and provider adapter interface
  - [x] 1.1 Create `src/lib/tts/types.ts` with TTSGenerationResult and TTSProviderAdapter interfaces per PRD
  - [x] 1.2 Add TTSProviderAdapter optional healthCheck method

- [x] 2.0 Provider registry
  - [x] 2.1 Create `src/lib/tts/registry.ts` with Map, getProvider(slug), and clear error when provider not found

- [x] 3.0 Provider adapters (ElevenLabs and OpenAI; others as stubs)
  - [x] 3.1 Create ElevenLabs adapter: `src/lib/tts/providers/elevenlabs.ts` - POST to /v1/text-to-speech/:voice_id, model_id maps to voice_id
  - [x] 3.2 Create OpenAI TTS adapter: `src/lib/tts/providers/openai-tts.ts` - POST to /v1/audio/speech
  - [x] 3.3 Create stub adapters: google-cloud-tts, amazon-polly, azure-tts (throw "Not implemented")

- [x] 4.0 API key decryption and retrieval
  - [x] 4.1 Create Supabase migration for decrypt_api_key function (pgp_sym_decrypt) — skipped: project uses app-level encryption
  - [x] 4.2 Create `src/lib/supabase/admin.ts` - service role client using SUPABASE_SECRET_KEY
  - [x] 4.3 Add getActiveApiKey(providerId) to existing `src/lib/crypto/keys.ts` (uses app-level decryptApiKey)
  - [x] 4.4 Add API_KEY_ENCRYPTION_SECRET to .env.local.example

- [x] 5.0 Retry, timeout, and circuit breaker
  - [x] 5.1 Create `src/lib/tts/retry.ts` - retry wrapper: 2 retries, exponential backoff (1s, 3s), 30s timeout
  - [x] 5.2 Create `src/lib/tts/circuit-breaker.ts` - log warning after 5 consecutive failures per provider

- [x] 6.0 Main generation flow (generateAndStoreAudio)
  - [x] 6.1 Create `src/lib/tts/generate.ts` - lookup model, sentence, provider; cache check; get API key; call adapter; measure latency; upload to R2; insert audio_files; return signed URL
  - [x] 6.2 Implement R2 key format: `{provider_slug}/{model_id}/{language_code}/{sentence_id}/{content_hash}.mp3`
  - [x] 6.3 Use uploadAudio and getSignedUrl from lib/r2/storage (default 1 hour expiry)
  - [x] 6.4 Use admin client (service role) for audio_files INSERT — bypasses RLS

- [x] 7.0 Error handling and logging
  - [x] 7.1 Log generation failures: provider slug, model ID, sentence ID, error message, latency, timestamp
  - [x] 7.2 Integrate circuit breaker into generate flow (log only; no auto-deactivate)
