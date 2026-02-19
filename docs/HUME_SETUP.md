# Hume AI TTS Setup

## API Key

1. Sign in at [Hume Portal](https://app.hume.ai/)
2. Go to [API keys](https://app.hume.ai/keys)
3. Use the **API key** in the `X-Hume-Api-Key` header for server-side requests

## Model IDs

| Model ID   | Name      | Endpoint                         | Languages |
|------------|-----------|----------------------------------|-----------|
| `octave-1` | Octave 1  | `https://api.hume.ai/v0/tts/file` | en, es    |
| `octave-2` | Octave 2  | `https://api.hume.ai/v0/tts/file` | en, ja, ko, es, fr, pt, it, de, ru, hi, ar |

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://api.hume.ai/v0/tts/file` | POST | Synthesize to audio file (non-streaming) |
| `https://api.hume.ai/v0/tts/stream/json` | POST | Stream JSON with base64 audio |
| `https://api.hume.ai/v0/tts/stream/file` | POST | Stream raw audio bytes |
| `https://api.hume.ai/v0/tts/voices` | GET | List voices (Voice Library or custom) |

## Voice ID – Gender – Language

Voices are fetched from the Hume API. Add them via Admin → Providers → Hume → Voices.

### Voice Library (HUME_AI)

- **voice_id**: UUID or name (e.g. `Male English Actor`, `9e068547-5ba4-4c8e-8e03-69282a008f04`)
- **provider**: `HUME_AI` (default when using UUID or name)
- List: `GET https://api.hume.ai/v0/tts/voices?provider=HUME_AI`

### Custom Voices (CUSTOM_VOICE)

- **voice_id**: `custom:UUID` (e.g. `custom:abc123...`)
- **provider**: `CUSTOM_VOICE`
- List: `GET https://api.hume.ai/v0/tts/voices?provider=CUSTOM_VOICE`

### CSV Import Format

For bulk voice import, use:

```
voice_name,voice_id,model_id,language_code,gender
Male English Actor,9e068547-5ba4-4c8e-8e03-69282a008f04,octave-2,en-US,male
Female Spanish,some-uuid-here,octave-2,es-ES,female
```

- `voice_id`: Hume voice UUID, or name for Voice Library, or `custom:UUID` for custom
- `model_id`: `octave-1` or `octave-2`
- `language_code`: e.g. `en-US`, `hi-IN`, `es-ES`, `ja-JP`, etc.
- `gender`: `male`, `female`, or `neutral`

## Post-Setup

1. Run migration: `supabase db push` or apply `20260219110000_hume_provider_setup.sql`
2. Add Hume API key in Admin → Providers → Hume → API Keys
3. Add voices via Admin UI or CSV import (Models → Voices tab)
4. Run Autogenerate to create models from voices
