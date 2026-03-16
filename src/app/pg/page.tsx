import {
  getActivePlaygroundPages,
  getPlaygroundConfig,
  getVoicesForProvider,
  getSampleSentences,
} from "./[slug]/actions";
import { getProviderModelLanguages } from "./actions";
import { VoicesClient } from "./voices-client";

const SENTENCE_SOURCE_SLUG = "falcon-vs-polly-neural";
const DEFAULT_INDUSTRY = "Retail";

export default async function MurfVoicesPage() {
  const [sentencePageConfig, comparePages] = await Promise.all([
    getPlaygroundConfig(SENTENCE_SOURCE_SLUG),
    getActivePlaygroundPages(),
  ]);

  const providerSlug = sentencePageConfig?.modelAProviderSlug ?? "";
  const modelId = sentencePageConfig?.modelAModelId ?? "";

  const languages =
    providerSlug && modelId
      ? await getProviderModelLanguages(providerSlug, modelId)
      : [];

  const defaultLang =
    languages.find((l) => l.code.toLowerCase() === "en-us") ?? languages[0];
  const defaultLangId = defaultLang?.id ?? "";

  const [initialVoices, initialSentences] = await Promise.all([
    defaultLangId
      ? getVoicesForProvider(providerSlug, defaultLangId, modelId)
      : Promise.resolve([]),
    defaultLangId && sentencePageConfig
      ? getSampleSentences(sentencePageConfig.id, defaultLangId, DEFAULT_INDUSTRY)
      : Promise.resolve([]),
  ]);

  return (
    <VoicesClient
      languages={languages}
      initialLanguageId={defaultLangId}
      initialVoices={initialVoices}
      initialSentences={initialSentences}
      sentencePageId={sentencePageConfig?.id ?? ""}
      providerSlug={providerSlug}
      modelId={modelId}
      comparePages={comparePages}
    />
  );
}
