import type { ValidModel, ValidOpenaiModel, ValidAnthropicModel, ValidGoogleModel } from "./schemas.ts";
import { validAnthropicModels, validGoogleModels, validOpenaiModels } from "./schemas.ts";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { createAnthropic, type AnthropicProvider } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from "@ai-sdk/google";
import fp from "fastify-plugin";

type ModelProviderConfig = {
  openai: {
    apiKey: string,
  },
  anthropic: {
    apiKey: string,
  },
  google: {
    apiKey: string,
  },
};

export class ModelProvider {
  public openai: OpenAIProvider;
  public anthropic: AnthropicProvider;
  public google: GoogleGenerativeAIProvider;

  constructor(config: ModelProviderConfig) {
    this.openai = createOpenAI(config.openai);
    this.anthropic = createAnthropic(config.anthropic);
    this.google = createGoogleGenerativeAI(config.google);
  }

  toLanguageModel(model: ValidModel) {
    if (isOpenaiModel(model)) {
      return this.openai(model);
    } else if (isAnthropicModel(model)) {
      return this.anthropic(model);
    } else if (isGoogleModel(model)) {
      return this.google(model);
    }
    throw new Error("Unknown model");
  }
}

function isOpenaiModel(model: ValidModel): model is ValidOpenaiModel {
  return validOpenaiModels.includes(model as ValidOpenaiModel);
}

function isAnthropicModel(model: ValidModel): model is ValidAnthropicModel {
  return validAnthropicModels.includes(model as ValidAnthropicModel);
}

function isGoogleModel(model: ValidModel): model is ValidGoogleModel {
  return validGoogleModels.includes(model as ValidGoogleModel);
}

declare module 'fastify' {
  interface FastifyInstance {
    modelProvider: ModelProvider;
  }
}

export const modelProviderPlugin = fp(async function (fastify, opts: ModelProviderConfig) {
  fastify.decorate("modelProvider", new ModelProvider(opts));
});

