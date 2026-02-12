# PRD 07: TTS Audio Generation Pipeline

## Introduction / Overview

At the heart of TTS Arena is the ability to generate speech audio from text using various TTS providers and serve that audio to users for blind comparison. This PRD defines the server-side audio generation pipeline: a provider adapter pattern that normalizes interactions with different TTS APIs, audio storage in Cloudflare R2, caching to avoid redundant generation, and error handling with retries.

No audio generation happens on the client. All TTS API calls are made server-side, and audio is stored in R2 with signed URLs returned to the browser for playback.

## Goals

1. Define a `TTSProvider` TypeScript interface that all provider adapters implement.
2. Build a provider registry that maps provider slugs to their adapter implementations.
3. Generate audio server-side, upload to Cloudflare R2, and return signed playback URLs.
4. Cache previously generated audio (same sentence + same model = reuse existing file).
5. Capture metadata: generation latency, file size, provider request IDs.
6. Handle provider failures gracefully with retries and circuit-breaking.

## User Stories

- **As the system**, I need to generate audio from any supported TTS provider by calling a uniform interface, regardless of each provider's unique API.
- **As the system**, I need to store generated audio files durably in R2 so they can be replayed (in test history, My Results, etc.) long after generation.
- **As the system**, I need to avoid regenerating the same audio if it was already generated for the same sentence and model, saving time and API costs.
- **As an admin**, I want to see generation latency and error rates per provider so I can make informed decisions about which providers to keep active.

## Functional Requirements

### Provider Adapter Interface

1. Define a TypeScript interface in `src/lib/tts/types.ts`:

   ```typescript
   export interface TTSGenerationResult {
     audioBuffer: Buffer;
     contentType: string;        // e.g., "audio/mpeg"
     durationMs?: number;        // audio duration if returned by the API
     providerRequestId?: string; // provider's request ID for debugging
   }

   export interface TTSProviderAdapter {
     readonly slug: string;
     readonly name: string;

     generateAudio(params: {
       text: string;
       modelId: string;
       language: string;
       gender: string;
       apiKey: string;
     }): Promise<TTSGenerationResult>;

     /** Optional: check if the provider is reachable */
     healthCheck?(apiKey: string): Promise<boolean>;
   }
   ```

2. Each provider has its own adapter file in `src/lib/tts/providers/`:
   - `src/lib/tts/providers/elevenlabs.ts`
   - `src/lib/tts/providers/google-cloud-tts.ts`
   - `src/lib/tts/providers/amazon-polly.ts`
   - `src/lib/tts/providers/azure-tts.ts`
   - `src/lib/tts/providers/openai-tts.ts`
   - Additional providers added as separate files following the same pattern.
   - The specific provider list will be supplied by the project owner; the architecture supports adding any provider by creating a new file that implements `TTSProviderAdapter`.

3. **Provider registry** (`src/lib/tts/registry.ts`):
   - A `Map<string, TTSProviderAdapter>` mapping provider slugs to adapter instances.
   - `getProvider(slug: string): TTSProviderAdapter` function.
   - Throws a clear error if the requested provider has no adapter.

### Audio Generation Flow

4. **Main generation function** (`src/lib/tts/generate.ts`):

   ```
   generateAndStoreAudio(modelId, sentenceId) → { audioFileId, signedUrl }
   ```

   Steps:
   1. Look up the `model` record (get `provider_id`, `model_id`, `gender`).
   2. Look up the `sentence` record (get `text`, `language_id` → `language.code`).
   3. Look up the `provider` record (get `slug`).
   4. **Cache check**: Query `audio_files` for an existing record with this `(model_id, sentence_id)`. If found, generate a signed URL for the existing R2 key and return early.
   5. Get the active API key for the provider (decrypt via `getActiveApiKey`).
   6. Get the provider adapter via the registry.
   7. Call `adapter.generateAudio(...)` with the text, model ID, language code, gender, and decrypted API key.
   8. Measure generation latency (start/end timestamps).
   9. Upload the resulting `audioBuffer` to Cloudflare R2.
   10. Insert a row into `audio_files` with the R2 key, file size, duration, latency, and provider request ID.
   11. Generate a signed URL for the newly uploaded file.
   12. Return `{ audioFileId, signedUrl }`.

5. **R2 file naming convention**:
   ```
   {provider_slug}/{model_id}/{language_code}/{sentence_id}/{content_hash}.mp3
   ```
   The `content_hash` is a short hash (first 8 chars of SHA-256) of the audio buffer, ensuring unique filenames even if regenerated.

6. **Signed URLs**: Generated using `@aws-sdk/s3-request-presigner` with a configurable expiry (default: 1 hour). Signed URLs are not stored — they are generated on demand from the R2 key.

### Error Handling and Retries

7. **Retry policy**: If a provider API call fails (network error, 5xx, timeout), retry up to 2 times with exponential backoff (1s, 3s). Use a simple retry wrapper function.

8. **Timeout**: Each provider API call has a 30-second timeout. If exceeded, the call is aborted and counted as a failure.

9. **Circuit breaking (simple)**: If a provider fails 5 consecutive times, log a warning. The system does NOT automatically deactivate the provider (that's an admin decision), but the matchmaking engine can optionally deprioritize providers with high recent error rates.

10. **Invalid round**: If audio generation fails for either side of a test round after all retries, the round is marked as `invalid` (`test_events.status = 'invalid'`), and the matchmaking engine picks a new pair.

11. **Error logging**: All generation failures are logged with: provider slug, model ID, sentence ID, error message, HTTP status code (if applicable), latency, and timestamp.

### Pre-Generation (Optional / Future)

12. **Background pre-generation**: An optional Server Action or cron job (Vercel Cron) that pre-generates audio for the most commonly needed (sentence, model) combinations:
    - Query active sentences and active models.
    - For each combination that does not have an `audio_files` record, generate and store.
    - Run during off-peak hours.
    - This is an optimization — the system works without it (on-demand generation is the primary path).

### Metadata Capture

13. Every generated audio file has the following metadata stored in `audio_files`:
    - `r2_key`: The object key in R2.
    - `file_size_bytes`: Size of the audio file.
    - `duration_ms`: Audio duration (if returned by the provider or computed from the buffer).
    - `generation_latency_ms`: Time from API call start to receiving the complete response.
    - `provider_request_id`: The request ID or trace ID from the provider's response headers.

## Non-Goals (Out of Scope)

- Client-side audio generation or streaming from the provider directly to the client.
- Audio format conversion (assume providers return MP3 or a web-playable format).
- Audio quality analysis or waveform visualization.
- Cost tracking per API call (can be added as a column later).
- Real-time streaming TTS (the pipeline generates complete audio files).

## Design Considerations

- This PRD has no user-facing UI — it is a backend pipeline. The admin sees generation metadata in the Admin Analytics dashboard (PRD 13).
- The provider adapter pattern is the key architectural decision: adding a new TTS provider should require ONLY creating a new file in `src/lib/tts/providers/` and registering it in the registry. No other code changes needed.

## Technical Considerations

- **Cloudflare R2 client**: Uses `@aws-sdk/client-s3` configured with:
  - Endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  - Region: `auto`
  - Credentials: `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
  - Bucket: `R2_BUCKET_NAME`

- **Signed URL generation**: Uses `@aws-sdk/s3-request-presigner` `getSignedUrl` with a `GetObjectCommand`. The signed URL is what gets sent to the client for audio playback.

- **Buffer handling**: Audio buffers may be several hundred KB. Ensure the Vercel Function has sufficient memory (default 1024 MB should be fine). Be mindful of the Vercel response size limits (Serverless Functions have a 4.5 MB response limit, but we're storing to R2 and returning only a URL).

- **Concurrency**: When the matchmaking engine requests audio for both models in a round, generate both in parallel (`Promise.all`). This halves the total wait time.

- **Supabase service role**: Audio file insertion uses the Supabase service role client (bypasses RLS) because the operation runs in a Server Action context where the user should not have direct INSERT permission on `audio_files`.

- **Content hash for deduplication**: If the exact same audio buffer is generated twice (rare, but possible if TTS output is deterministic), the R2 key will be the same, and the upload will overwrite — which is idempotent and correct.

## Success Metrics

- Audio generation succeeds for at least 95% of attempts (accounting for occasional provider failures).
- Cached audio (cache hit) returns a signed URL in < 500ms.
- Fresh audio generation (cache miss) completes in < 10 seconds for 90% of cases.
- A new provider can be added by creating a single adapter file and adding one line to the registry.
- All generated audio is playable in Chrome, Firefox, and Safari via the `<audio>` element.

## Open Questions

1. Should we support audio formats other than MP3 (e.g., WAV, OGG)? Recommendation: accept whatever the provider returns, but prefer MP3 for compatibility and size. If a provider returns WAV, convert to MP3 server-side using `ffmpeg` (or require the provider API to return MP3).
2. Should R2 keys include a timestamp to support regeneration of the same (sentence, model) pair? Recommendation: no — use the content hash. If regeneration is needed, delete the old `audio_files` row first.
3. What should the signed URL expiry be? Recommendation: 1 hour for test rounds (short-lived), 24 hours for history replay (longer-lived). The expiry can be a parameter of the `getSignedUrl` helper.
