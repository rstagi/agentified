import { type Config } from "./config.ts";
import fastify from "fastify";
import { type ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { modelProviderPlugin } from "./agent/models.ts";
import agentRoutes from "./agent/routes.ts";
import fs from "fs";

const scriptJs = fs.readFileSync('./src/widget.js');

export async function build(config: Config) {
  const server = fastify({
    logger: {
      level: config.logLevel,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Set up Zod validation
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // Register CORS plugin
  server.register(import("@fastify/cors"), {
    // TODO: make origin parametric
    origin: "*",
  });

  // Register MongoDB plugin
  server.register(import("@fastify/mongodb"), {
    forceClose: true,
    url: config.mongoDbUrl,
    database: config.mongoDbName,
    directConnection: true,
  });

  server.register(modelProviderPlugin, {
    openai: {
      apiKey: config.openaiApiKey,
    },
    anthropic: {
      apiKey: config.anthropicApiKey,
    },
    google: {
      apiKey: config.googleApiKey,
    },
  });

  server.get('/ping', async () => {
    return 'pong\n'
  });

  server.get('/widget.js', async () => {
    return scriptJs;
  })
  // Register routes
  server.register(agentRoutes, {
    prefix: "/agent",
  });

  return server;
}

