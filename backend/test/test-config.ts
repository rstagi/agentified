import { type Config } from "../src/config.ts";

export const testConfig = {
  logLevel: "silent",
  openaiApiKey: process.env.OPENAI_API_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  googleApiKey: process.env.GOOGLE_API_KEY!,
} as const satisfies Partial<Config>;

