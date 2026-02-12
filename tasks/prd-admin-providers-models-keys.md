# PRD 06: Admin -- Provider, Model/Voice and API Key Management

## Introduction / Overview

TTS Arena compares voices from 25+ TTS providers. Admins need to manage the catalog of providers, their models/voices, and the API credentials used to call each provider's API. This PRD covers the full admin CRUD interface for providers, models/voices, and encrypted API key management.

Provider and model management is critical to the matchmaking system — only active providers with active models that support the requested language and have valid API keys participate in test rounds.

## Goals

1. Provide CRUD interfaces for providers, models/voices, and API keys under `/admin/providers`.
2. Support instant deactivation of providers or models (immediately stops them from being selected for new test rounds).
3. Store API keys encrypted at rest, accessible only server-side.
4. Support key rotation without downtime (add new key, deprecate old, revoke old).
5. Track all admin actions in the audit log.

## User Stories

- **As an admin**, I want to add a new TTS provider (e.g., "ElevenLabs") with its API base URL so the system knows how to reach it.
- **As an admin**, I want to add models/voices under a provider, specifying which languages and genders they support.
- **As an admin**, I want to deactivate a model instantly if it starts producing poor audio, without deleting its historical data.
- **As an admin**, I want to store API keys securely and rotate them without affecting ongoing tests.
- **As an admin**, I want to tag models (e.g., "neural", "fast", "premium") so I can filter and analyze performance by tag.

## Functional Requirements

### Provider Management (`/admin/providers`)

1. **Providers list page**: A GlassTable with columns: Name, Slug, Base URL, Status (active/inactive), Model Count (active/total), Created Date.

2. **Add provider**: GlassModal form:
   - Fields: Name (text), Slug (auto-generated from name, editable), Base URL (text, optional).
   - Validation: name required and unique, slug required, unique, and URL-safe (lowercase alphanumeric + hyphens).
   - Server Action inserts into `providers` table. Log to `admin_audit_log`.

3. **Edit provider**: Click row to open pre-filled modal. Can edit name, slug, base URL.
   - Server Action updates the row. Log to `admin_audit_log`.

4. **Toggle provider active/inactive**: Inline toggle. Deactivating a provider:
   - Shows confirmation dialog: "Deactivating this provider will remove all its models from matchmaking. Continue?"
   - Server Action sets `providers.is_active = false`. The matchmaking engine checks `providers.is_active` when selecting candidates.
   - Does NOT cascade-deactivate individual models (the model `is_active` flags remain unchanged; the provider-level flag is an override).
   - Log to `admin_audit_log`.

5. **Delete provider**: Not supported via UI — deactivate instead.

### Model/Voice Management (`/admin/providers/[providerId]/models`)

6. **Models list page** (scoped to a provider): Clicking a provider row navigates to its models page. GlassTable with columns: Name, Model ID, Gender, Languages (comma-separated codes), Tags, Status, Created Date.

7. **Filter bar**: Filter by gender, language, tag, status. Search by name or model ID.

8. **Add model**: GlassModal form:
   - Fields:
     - Name (text) — display name.
     - Model ID (text) — the provider-specific identifier used in API calls.
     - Gender (select: male / female / neutral).
     - Supported languages (multi-select from active languages).
     - Tags (comma-separated text input, rendered as badges).
   - Validation: name required, model ID required and unique within this provider, gender required, at least one language required.
   - Server Action inserts into `models` table and `model_languages` junction table. Log to `admin_audit_log`.

9. **Edit model**: Click row to open pre-filled modal. Can edit all fields.
   - Server Action updates `models` row and syncs `model_languages` (delete old + insert new). Log to `admin_audit_log`.

10. **Toggle model active/inactive**: Inline toggle. Deactivating a model removes it from matchmaking. Log to `admin_audit_log`.

11. **Bulk model status change**: Checkboxes on each row + a bulk action dropdown ("Activate Selected", "Deactivate Selected") for managing many models at once.

12. **Delete model**: Not supported via UI — deactivate instead.

### API Key Management (`/admin/providers/[providerId]/keys`)

13. **Keys list** on the provider detail page (separate tab or section): GlassTable with columns: Key Name, Status (active / deprecated / revoked), Created Date, Last Updated.
    - The actual key value is NEVER displayed. Show only the key name and a masked preview (e.g., `sk-****7f3a`).

14. **Add key**: GlassModal form:
    - Fields: Key Name (text), API Key Value (password input, masked).
    - On submit: Server Action encrypts the key value using `pgcrypto` (`pgp_sym_encrypt(key_value, encryption_secret)`) and stores the encrypted blob in `api_keys.encrypted_key`.
    - The encryption secret is stored as an environment variable (`API_KEY_ENCRYPTION_SECRET`), never in the database.
    - Log to `admin_audit_log` (log the action, NOT the key value).

15. **Key rotation workflow**:
    - Step 1: Admin adds a new key (status `active`).
    - Step 2: Admin deprecates the old key (changes status to `deprecated`).
    - Step 3: After confirming the new key works, admin revokes the old key (status `revoked`).
    - The TTS audio generation pipeline (PRD 07) always uses the first `active` key for a provider.

16. **Revoke key**: Changes status to `revoked`. Revoked keys are kept in the database for audit purposes but never used.

17. **Delete key**: Hard delete only for revoked keys (optional — can defer and just keep revoked keys forever).

### Server-Side Key Decryption

18. A utility function in `src/lib/crypto/keys.ts`:
    ```typescript
    export async function decryptApiKey(encryptedKey: string): Promise<string> {
      const { data, error } = await supabaseAdmin.rpc('decrypt_api_key', {
        encrypted: encryptedKey,
      });
      if (error) throw error;
      return data;
    }
    ```
    Backed by a Supabase database function:
    ```sql
    CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted text)
    RETURNS text AS $$
    BEGIN
      RETURN pgp_sym_decrypt(encrypted::bytea, current_setting('app.api_key_secret'));
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```
    The `app.api_key_secret` setting is configured via Supabase dashboard or `ALTER DATABASE ... SET app.api_key_secret = '...'`.

19. **Key retrieval for TTS calls**: The `getActiveApiKey(providerId)` function queries `api_keys` WHERE `provider_id = X AND status = 'active'` ORDER BY `created_at DESC` LIMIT 1, then decrypts and returns the key. This function is ONLY callable server-side.

## Non-Goals (Out of Scope)

- Automated provider health checks or uptime monitoring.
- Cost tracking per provider/model (deferred to a future analytics PRD).
- Auto-discovery of available models from provider APIs (manual entry only).
- Provider-specific configuration beyond base URL and API key (e.g., region, tier).

## Design Considerations

- The providers page uses a master-detail pattern: clicking a provider shows its models and keys.
- The models table should display language support as small GlassBadges (e.g., `en`, `es`, `hi` in blue badges).
- Tags should also render as GlassBadges with different colors based on tag name (neural = purple, fast = green, premium = yellow).
- API key values should use a password-style input — never shown in plain text, with a "copy" button that temporarily decrypts and copies to clipboard (admin action, logged).

## Technical Considerations

- The `pgcrypto` extension must be enabled in Supabase (PRD 03 covers this).
- API key encryption uses symmetric encryption (`pgp_sym_encrypt` / `pgp_sym_decrypt`) with a secret stored as a Postgres runtime setting. This keeps the encryption within the database layer, avoiding key material in application code.
- The provider slug is used in R2 file paths (e.g., `elevenlabs/model-name/en/sentence-id/hash.mp3`), so it must be URL-safe and immutable after models have been created. Warn admin when editing a slug if models already exist.
- The `model_languages` junction table handles the many-to-many relationship between models and languages. When updating a model's language support, the Server Action deletes all existing `model_languages` rows for that model and re-inserts the new set (simple and idempotent).
- All admin operations use the Supabase server client with RLS (the admin's session has the `admin` role, which RLS allows full access).

## Success Metrics

- An admin can add a provider, add models under it, and add an API key — all within 2 minutes.
- Deactivating a provider immediately removes its models from the matchmaking candidate pool.
- API keys are never stored in plain text and never sent to the client.
- Key rotation can be performed with zero downtime.
- All CRUD actions are recorded in `admin_audit_log`.

## Open Questions

1. Should we support multiple API keys being active simultaneously for the same provider (e.g., for load balancing)? Recommendation: start with one active key per provider; add round-robin later if needed.
2. Should the "copy key" button exist at all (security risk of clipboard)? Recommendation: include it for admin convenience but log the action; alternatively, never show the key after initial entry.
3. Should provider base URLs be validated (e.g., check that they respond to a health endpoint)? Recommendation: defer — just store the URL as-is.
