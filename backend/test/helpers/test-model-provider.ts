import { ModelProvider } from "../../src/agent/models.ts";
import { testConfig } from "../test-config.ts";

export function testModelProvider() {
  return new ModelProvider({
    openai: {
      apiKey: testConfig.openaiApiKey,
    },
    anthropic: {
      apiKey: testConfig.anthropicApiKey,
    },
    google: {
      apiKey: testConfig.googleApiKey,
    },
  });

}
