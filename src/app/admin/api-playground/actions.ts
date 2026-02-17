"use server";

import { parseCurlCommand } from "curl-parser-ts";
import { createClient } from "@/lib/supabase/server";

export type CurlResult =
  | { ok: true; status: number; headers: Record<string, string>; body: string; isBinary: boolean }
  | { ok: false; error: string };

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Allow HTTPS and HTTP (for localhost during development)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    // Block private/internal IPs for SSRF protection (except localhost)
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return true;
    if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function executeCurl(curlCommand: string): Promise<CurlResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Admin access required" };

  const trimmed = curlCommand.trim();
  if (!trimmed) return { ok: false, error: "Paste a cURL command to run" };

  if (!trimmed.toLowerCase().startsWith("curl")) {
    return { ok: false, error: "Invalid cURL command. It should start with 'curl'" };
  }

  let parsed;
  try {
    parsed = parseCurlCommand(trimmed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to parse cURL command";
    return { ok: false, error: `Parse error: ${msg}` };
  }

  const url = parsed.url;
  if (!url) return { ok: false, error: "No URL found in cURL command" };
  if (!isAllowedUrl(url)) return { ok: false, error: "URL not allowed (blocked for security)" };

  const method = (parsed.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = { ...(parsed.headers ?? {}) };

  // Add query params to URL if present
  let finalUrl = url;
  if (parsed.query && Object.keys(parsed.query).length > 0) {
    const u = new URL(url);
    for (const [k, v] of Object.entries(parsed.query)) {
      u.searchParams.set(k, String(v));
    }
    finalUrl = u.toString();
  }

  let body: string | undefined;
  if (parsed.data) {
    body = parsed.data;
  } else if (parsed.formData && Object.keys(parsed.formData).length > 0) {
    body = new URLSearchParams(parsed.formData as Record<string, string>).toString();
    headers["Content-Type"] = headers["Content-Type"] ?? "application/x-www-form-urlencoded";
  }

  try {
    const res = await fetch(finalUrl, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body ?? undefined,
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isBinary =
      contentType.startsWith("audio/") ||
      contentType.startsWith("application/octet-stream") ||
      !contentType.includes("json") && !contentType.includes("text");

    let bodyText: string;
    if (isBinary) {
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      const mime = contentType.split(";")[0].trim() || "application/octet-stream";
      bodyText = `data:${mime};base64,${b64}`;
    } else {
      bodyText = await res.text();
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    return {
      ok: true,
      status: res.status,
      headers: responseHeaders,
      body: bodyText,
      isBinary,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { ok: false, error: msg };
  }
}
