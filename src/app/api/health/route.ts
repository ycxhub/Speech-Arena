/**
 * DEV-ONLY health-check route.
 * Tests Supabase and R2 connectivity.
 * TODO: Remove or protect this route before production launch.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getR2Client } from "@/lib/r2/client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // --- Supabase check ---
  try {
    const supabase = await createClient();
    // Lightweight query to validate connection (profiles exists and is small)
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      // Any Postgres error code means the connection itself succeeded
      results.supabase = { status: "ok", detail: `connected (pg code: ${error.code})` };
    } else {
      results.supabase = { status: "ok", detail: "connected" };
    }
  } catch (err) {
    results.supabase = { status: "error", message: String(err) };
  }

  // --- R2 check ---
  try {
    const r2 = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME;
    // List up to 1 object in the bucket — validates credentials + bucket access
    const resp = await r2.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 })
    );
    results.r2 = {
      status: "ok",
      bucket,
      objectCount: resp.KeyCount ?? 0,
    };
  } catch (err) {
    results.r2 = { status: "error", message: String(err) };
  }

  const allOk = Object.values(results).every(
    (r) => (r as Record<string, unknown>).status === "ok"
  );

  return NextResponse.json(results, { status: allOk ? 200 : 500 });
}
