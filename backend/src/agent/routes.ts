import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { TypedFastify } from '../types.js';
import { askAgent } from './agent.ts';
import { safeValidateUIMessages } from 'ai';

const agentRoutes: FastifyPluginAsync = async function (fastify: TypedFastify) {
  const chatSchema = {
    body: z.object({
      messages: z.array(z.any()),
    }),
  };

  fastify.post('/chat', { schema: chatSchema }, async (request, reply) => {
    const { messages } = request.body;

    const messagesValidation = await safeValidateUIMessages({ messages });
    if (!messagesValidation.success) {
      // TODO: avoid exposing error
      return reply.status(400).send({ error: messagesValidation.error });
    }

    const uiMessages = messagesValidation.data;

    const configuredAgent = {
      id: "some-agent",
      systemPrompt: "You are a helpful agent.",
      model: fastify.modelProvider.toLanguageModel("gpt-5-nano"),
      createdAt: new Date(),
    };

    const result = askAgent(configuredAgent, uiMessages);
    result.pipeUIMessageStreamToResponse(reply.raw, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,HEAD,POST',
        'access-control-allow-headers': 'Content-Type',
      },
    });
  });
};

export default agentRoutes;

