"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { executeCurl, type CurlResult } from "./actions";
import { toast } from "sonner";

const TTS_VENDOR_DOCS = [
  { name: "ElevenLabs", url: "https://elevenlabs.io/docs/api-reference/text-to-speech" },
  { name: "OpenAI TTS", url: "https://platform.openai.com/docs/api-reference/audio/createSpeech" },
  { name: "Google Cloud TTS", url: "https://cloud.google.com/text-to-speech/docs" },
  { name: "Amazon Polly", url: "https://docs.aws.amazon.com/polly/latest/dg/API_Reference.html" },
  { name: "Azure TTS", url: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech" },
  { name: "Deepgram", url: "https://developers.deepgram.com/docs/text-to-speech" },
  { name: "PlayHT", url: "https://docs.play.ht/reference/api-overview" },
  { name: "Replicate (Bark)", url: "https://replicate.com/docs/reference/http" },
] as const;

const SAMPLE_CURL = `curl -X POST 'https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID' \\
  -H 'xi-api-key: YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"text": "Hello world", "model_id": "eleven_multilingual_v2"}'`;

export function ApiPlaygroundClient() {
  const [curl, setCurl] = useState(SAMPLE_CURL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CurlResult | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await executeCurl(curl);
      setResult(res);
      if (res.ok) {
        toast.success(`Request completed: ${res.status}`);
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = e.target.value;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="mb-2 text-section-heading">cURL API Runner</h2>
        <p className="mb-4 text-sm text-white/60">
          Paste cURL commands from TTS vendor API docs and run them here. Results show status,
          headers, and response body. For audio responses, a player and download link appear.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/60">Quick links:</span>
          <select
            onChange={handleVendorSelect}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
          >
            <option value="">Select vendor API docs…</option>
            {TTS_VENDOR_DOCS.map((v) => (
              <option key={v.name} value={v.url}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">cURL command</label>
          <textarea
            value={curl}
            onChange={(e) => setCurl(e.target.value)}
            placeholder="Paste your cURL command here..."
            rows={12}
            className="w-full rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-sm text-white placeholder:text-white/40 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            spellCheck={false}
          />
          <GlassButton onClick={handleRun} loading={loading} disabled={loading}>
            Run cURL
          </GlassButton>
        </div>
      </GlassCard>

      {result && (
        <GlassCard>
          <h2 className="mb-4 text-section-heading">Response</h2>
          {result.ok ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    result.status >= 200 && result.status < 300
                      ? "bg-accent-green/20 text-accent-green"
                      : result.status >= 400
                        ? "bg-accent-red/20 text-accent-red"
                        : "bg-accent-yellow/20 text-accent-yellow"
                  }`}
                >
                  {result.status} {result.status >= 200 && result.status < 300 ? "OK" : ""}
                </span>
              </div>

              {Object.keys(result.headers).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
                    Response headers
                  </p>
                  <pre className="max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                    {Object.entries(result.headers)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n")}
                  </pre>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
                  Response body
                </p>
                {result.isBinary && result.body.startsWith("data:audio/") ? (
                  <div className="space-y-2">
                    <audio controls src={result.body} className="w-full max-w-md" />
                    <a
                      href={result.body}
                      download="tts-output.mp3"
                      className="inline-block text-sm text-accent-blue hover:underline"
                    >
                      Download audio
                    </a>
                  </div>
                ) : result.isBinary ? (
                  <p className="text-sm text-white/60">
                    Binary response ({result.body.length} chars). Download link not shown for
                    non-audio types.
                  </p>
                ) : (
                  <pre className="max-h-96 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80 whitespace-pre-wrap break-words">
                    {(() => {
                      try {
                        const parsed = JSON.parse(result.body);
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return result.body;
                      }
                    })()}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3">
              <p className="text-sm text-accent-red">{result.error}</p>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
