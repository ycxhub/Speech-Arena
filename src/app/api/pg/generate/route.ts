import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveApiKey } from "@/lib/crypto/keys";
import "@/lib/tts/providers";
import { getProvider } from "@/lib/tts/registry";

const MAX_TEXT_LENGTH = 1000;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

type RateLimitEntry = {
  windowStart: number;
  count: number;
};

const ipRateLimit = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = ipRateLimit.get(ip);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRateLimit.set(ip, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  ipRateLimit.set(ip, existing);

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  }

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
