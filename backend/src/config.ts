import fs from 'fs';
import { z } from 'zod';

// export type Config = InferConfig<typeof configSchema>;
export type Config = z.infer<typeof configSchema>;
const configSchema = z.object({
  port: z.coerce.number()
    .default(8080)
    .describe("The port to listen on"),
  logLevel: z.enum([
    "trace",
    "debug",
    "info",
    "warning",
    "error",
    "silent",
  ]).default("info"),
  mongoDbUrl: z.string()
    .nonempty()
    .describe("MongoDB connection URL"),
  mongoDbName: z.string()
    .default("some_db")
    .describe("MongoDB database name"),
  openaiApiKey: z.string()
    .nonempty()
    .describe("OpenAI API Key"),
  anthropicApiKey: z.string()
    .nonempty()
    .describe("Anthropic API Key"),
  googleApiKey: z.string()
    .nonempty()
    .describe("Google API Key"),
} as const);

const envVars: Partial<Record<keyof Config, string | undefined>> = {
  port: process.env.PORT,
  logLevel: process.env.LOG_LEVEL,
  mongoDbUrl: process.env.MONGODB_URL,
  mongoDbName: process.env.MONGODB_NAME,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
};

export function getConfig(): Config {
  const configPath = process.env.CONFIG_PATH;
  const configFile = configPath ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};

  const config: Partial<Config> = {};
  for (const key of Object.keys(configSchema.shape) as (keyof Config)[]) {
    config[key] = envVars[key] ?? configFile[key];
  }

  return configSchema.parse(config);
}

