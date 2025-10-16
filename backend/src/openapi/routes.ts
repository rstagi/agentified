import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { TypedFastify } from '../types.ts';
import { OpenAPISpecRepository } from './repository.ts';
import { OpenAPISpecService } from './service.ts';

const openapiRoutes: FastifyPluginAsync = async function (fastify: TypedFastify) {
  // Initialize repository and service
  const repository = new OpenAPISpecRepository(fastify.mongo.db!);
  const service = new OpenAPISpecService(repository);

  // Schema for creating a spec
  const createSpecSchema = {
    body: z.object({
      name: z.string(),
      spec: z.unknown(),
    }),
  };

  // Schema for ID parameter
  const idParamSchema = {
    params: z.object({
      id: z.string(),
    }),
  };

  // POST /specs - Create a new OpenAPI spec
  fastify.post('/specs', { schema: createSpecSchema }, async (request, reply) => {
    const { name, spec } = request.body;

    try {
      const created = await service.createSpec({ name, spec });
      return reply.status(201).send(created);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Invalid OpenAPI spec',
      });
    }
  });

  // GET /specs - List all OpenAPI specs
  fastify.get('/specs', async (request, reply) => {
    const specs = await service.listSpecs();
    return reply.status(200).send(specs);
  });

  // GET /specs/:id - Get a specific OpenAPI spec
  fastify.get('/specs/:id', { schema: idParamSchema }, async (request, reply) => {
    const { id } = request.params;

    const spec = await service.getSpec(id);

    if (!spec) {
      return reply.status(404).send({ error: 'OpenAPI spec not found' });
    }

    return reply.status(200).send(spec);
  });

  // DELETE /specs/:id - Delete an OpenAPI spec
  fastify.delete('/specs/:id', { schema: idParamSchema }, async (request, reply) => {
    const { id } = request.params;

    // Check if spec exists before deleting
    const spec = await service.getSpec(id);
    if (!spec) {
      return reply.status(404).send({ error: 'OpenAPI spec not found' });
    }

    await service.deleteSpec(id);
    return reply.status(204).send();
  });

  // GET /specs/:id/operations - Get operations from a spec
  fastify.get('/specs/:id/operations', { schema: idParamSchema }, async (request, reply) => {
    const { id } = request.params;

    try {
      const operations = await service.getOperations(id);
      return reply.status(200).send(operations);
    } catch (error) {
      if (error instanceof Error && error.message === 'OpenAPI spec not found') {
        return reply.status(404).send({ error: error.message });
      }
      throw error;
    }
  });
};

export default openapiRoutes;
