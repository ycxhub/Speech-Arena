import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveApiKey } from "@/lib/crypto/keys";
import "@/lib/tts/providers";
import { getProvider } from "@/lib/tts/registry";

const MAX_TEXT_LENGTH = 1000;

export async function POST(request: NextRequest) {
  let body: {
    providerSlug?: string;
    modelId?: string;
    voiceId?: string;
    text?: string;
    languageCode?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { providerSlug, modelId, voiceId, text, languageCode } = body;

  if (!providerSlug || !modelId || !voiceId || !text || !languageCode) {
    return NextResponse.json(
      { error: "Missing required fields: providerSlug, modelId, voiceId, text, languageCode" },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text exceeds ${MAX_TEXT_LENGTH} character limit` },
      { status: 400 }
    );
  }

  try {
    const supabase = getAdminClient();
    const { data: provider, error: providerErr } = await supabase
      .from("providers")
      .select("id, slug")
      .eq("slug", providerSlug)
      .maybeSingle();

    if (providerErr || !provider) {
      return NextResponse.json(
        { error: `Provider not found: ${providerSlug}` },
        { status: 404 }
      );
    }

    const apiKey = await getActiveApiKey(provider.id);
    const adapter = getProvider(providerSlug);

    const result = await adapter.generateAudio({
      text,
      modelId,
      voiceId,
      language: languageCode,
      gender: "neutral",
      apiKey,
    });

    return new Response(new Uint8Array(result.audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": result.contentType || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[Murf Playground Generate]", err);
    const message = err instanceof Error ? err.message : "Audio generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
