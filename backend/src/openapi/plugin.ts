import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { OpenAPISpecRepository } from './repository.ts';
import { ToolProviderService } from './tool-provider.ts';
import type { OpenAPITool } from './infrastructure/openapi-tool.ts';

/**
 * OpenAPI Tools API exposed on fastify instance
 */
export class OpenAPITools {
  constructor(private repository: OpenAPISpecRepository) {}

  /**
   * Loads tools for a specific OpenAPI spec by ID
   */
  async getToolsBySpecId(id: string): Promise<Record<string, OpenAPITool>> {
    const spec = await this.repository.findById(id);

    if (!spec) {
      throw new Error('OpenAPI spec not found');
    }

    const toolProvider = new ToolProviderService(spec.spec);
    return await toolProvider.getTools();
  }
}

// Augment Fastify types to include the openapiTools decorator
declare module 'fastify' {
  interface FastifyInstance {
    openapiTools: OpenAPITools;
  }
}

export default fp(
  async function (fastify: FastifyInstance) {
    const repository = new OpenAPISpecRepository(fastify.mongo.db!);
    const openapiTools = new OpenAPITools(repository);

    fastify.decorate('openapiTools', openapiTools);
  },
  {
    name: 'openapi-tools',
    dependencies: ['@fastify/mongodb'],
  }
);
