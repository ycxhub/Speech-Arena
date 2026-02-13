/**
 * Cron endpoint for TTS pre-generation.
 * Configure in vercel.json: "crons": [{ "path": "/api/cron/pre-generate", "schedule": "0 2 * * *" }]
 * Or call manually with CRON_SECRET header for auth.
 */

import { NextResponse } from "next/server";
import { preGenerateAudio } from "@/lib/tts/pre-generate";

export const maxDuration = 300; // 5 min for Vercel Pro

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const maxPairs = searchParams.get("max") ? parseInt(searchParams.get("max")!, 10) : 500;
    const languageId = searchParams.get("language") ?? undefined;

    const result = await preGenerateAudio({ maxPairs, languageId });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Pre-generate cron failed]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pre-generation failed" },
      { status: 500 }
    );
  }
}
