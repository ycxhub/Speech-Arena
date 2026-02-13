/**
 * TTS Provider Adapters — register all providers with the registry.
 */

import { registerProvider } from "../registry";
import { elevenlabsAdapter } from "./elevenlabs";
import { openaiTtsAdapter } from "./openai-tts";
import { googleCloudTtsAdapter } from "./google-cloud-tts";
import { amazonPollyAdapter } from "./amazon-polly";
import { azureTtsAdapter } from "./azure-tts";

registerProvider(elevenlabsAdapter);
registerProvider(openaiTtsAdapter);
registerProvider(googleCloudTtsAdapter);
registerProvider(amazonPollyAdapter);
registerProvider(azureTtsAdapter);
