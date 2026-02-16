"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveApiKey } from "@/lib/crypto/keys";
import { getProvider } from "@/lib/tts/registry";
import { withRetry } from "@/lib/tts/retry";
import "@/lib/tts/providers";

export async function testProviderApi(
  providerId: string,
  modelId: string,
  languageCode: string,
  text: string
): Promise<{ audioDataUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Forbidden: admin access required" };

  const { data: model } = await admin
    .from("models")
    .select("model_id, voice_id, gender")
    .eq("id", modelId)
    .eq("provider_id", providerId)
    .single();
  if (!model) return { error: "Model not found" };

  const { data: provider } = await admin
    .from("providers")
    .select("slug")
    .eq("id", providerId)
    .single();
  if (!provider) return { error: "Provider not found" };

  let apiKey: string;
  try {
    apiKey = await getActiveApiKey(providerId);
  } catch {
    return { error: "No active API key for this provider" };
  }

  const adapter = getProvider(provider.slug);

  try {
    const result = await withRetry((signal) =>
      adapter.generateAudio({
        text: text.trim() || "Hi there, run a quick test to confirm it works",
        modelId: model.model_id,
        voiceId: model.voice_id ?? undefined,
        language: languageCode,
        gender: model.gender,
        apiKey,
        signal,
      })
    );

    const base64 = result.audioBuffer.toString("base64");
    const mime = result.contentType || "audio/mpeg";
    const audioDataUrl = `data:${mime};base64,${base64}`;

    return { audioDataUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
