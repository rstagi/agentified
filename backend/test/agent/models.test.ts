import { describe, expect, it } from "vitest";
import { testModelProvider } from "../helpers/test-model-provider.ts";

const modelProvider = testModelProvider();

describe("Models test", () => {
  it("if openAI family, should return OpenAI model", () => {
    const openaiModels = ["gpt-5", "gpt-4.1-nano"] as const;
    for (const model of openaiModels) {
      expect(modelProvider.toLanguageModel(model).provider).to.equal("openai.responses");
    }
  });

  it("if anthropic family, should return anthropic model", () => {
    const anthropicModels = ["claude-haiku-3.5", "claude-sonnet-3.7"] as const;
    for (const model of anthropicModels) {
      expect(modelProvider.toLanguageModel(model).provider).to.equal("anthropic.messages");
    }
  });

  it("if google family, should return anthropic model", () => {
    const googleModels = ["gemini-2.5-pro", "gemini-2.0-flash"] as const;
    for (const model of googleModels) {
      expect(modelProvider.toLanguageModel(model).provider).to.equal("google.generative-ai");
    }
  });

  it("if unknown model, should raise error", () => {
    // @ts-expect-error
    expect(() => modelProvider.toLanguageModel("some-model")).to.throw("Unknown model");
  })
});

