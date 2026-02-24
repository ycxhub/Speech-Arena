import { listAllModelPages } from "@/lib/models/get-model-page";
import { CompareHubClient } from "./compare-hub-client";

export const metadata = {
  title: "Compare TTS Models | TTS Battles",
  description: "Compare two TTS models side-by-side. See pricing, latency, and capabilities.",
};

export default async function CompareHubPage() {
  const modelPages = await listAllModelPages();
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare Models</h1>
        <p className="mt-2 text-white/60">
          Select two models to compare them side-by-side.
        </p>
      </div>
      <CompareHubClient modelPages={modelPages} />
    </div>
  );
}
