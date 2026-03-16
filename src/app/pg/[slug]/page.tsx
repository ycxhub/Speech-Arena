import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPlaygroundConfig,
  getLanguagesForPlayground,
  getSampleSentences,
  getVoicesForProvider,
} from "./actions";
import { PlaygroundClient } from "./playground-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPlaygroundConfig(slug);
  if (!config) return { title: "Not Found" };
  return {
    title: config.title,
    robots: { index: false, follow: false },
  };
}

export default async function PlaygroundPage({ params }: Props) {
  const { slug } = await params;
  const config = await getPlaygroundConfig(slug);
  if (!config) notFound();

  const languages = await getLanguagesForPlayground(
    config.modelAProviderSlug,
    config.modelBProviderSlug
  );

  const enUsLang = languages.find(
    (l) => l.code.toLowerCase().replace("_", "-") === "en-us"
  );
  const defaultLanguageId = enUsLang?.id ?? languages[0]?.id ?? "";

  const initialVoicesA = defaultLanguageId
    ? await getVoicesForProvider(
        config.modelAProviderSlug,
        defaultLanguageId,
        config.modelAModelId
      )
    : [];
  const initialVoicesB = defaultLanguageId
    ? await getVoicesForProvider(
        config.modelBProviderSlug,
        defaultLanguageId,
        config.modelBModelId
      )
    : [];
  const initialSentences = defaultLanguageId
    ? await getSampleSentences(config.id, defaultLanguageId, "Retail")
    : [];

  return (
    <PlaygroundClient
      config={config}
      languages={languages}
      initialLanguageId={defaultLanguageId}
      initialVoicesA={initialVoicesA}
      initialVoicesB={initialVoicesB}
      initialSentences={initialSentences}
    />
  );
}
