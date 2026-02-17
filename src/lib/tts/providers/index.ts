/**
 * TTS Provider Adapters — register all providers with the registry.
 */

import { registerProvider } from "../registry";
import { elevenlabsAdapter } from "./elevenlabs";
import { openaiTtsAdapter } from "./openai-tts";
import { googleCloudTtsAdapter } from "./google-cloud-tts";
import { amazonPollyAdapter } from "./amazon-polly";
import { azureTtsAdapter } from "./azure-tts";
import { cartesiaAdapter } from "./cartesia";
import { murfAdapter } from "./murf";
import { deepgramAdapter } from "./deepgram";
import { inworldAdapter } from "./inworld";
import { minimaxAdapter } from "./minimax";

registerProvider(elevenlabsAdapter);
registerProvider(openaiTtsAdapter);
registerProvider({ ...openaiTtsAdapter, slug: "openai", name: "OpenAI" });
registerProvider(googleCloudTtsAdapter);
registerProvider(amazonPollyAdapter);
registerProvider(azureTtsAdapter);
registerProvider(cartesiaAdapter);
registerProvider(murfAdapter);
registerProvider({ ...murfAdapter, slug: "murf-ai", name: "Murf AI" }); // alias for slugFromName("Murf AI")
registerProvider(deepgramAdapter);
registerProvider(inworldAdapter);
registerProvider(minimaxAdapter);
