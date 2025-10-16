import type { OpenAPISpecRepository } from './repository.ts';
import type { OpenAPISpec, CreateOpenAPISpec } from './types.ts';
import { parseOpenAPISpec, type OpenAPIOperation } from './infrastructure/parser.ts';

/**
 * Application service for managing OpenAPI specs.
 * Orchestrates validation, persistence, and operation extraction.
 */
export class OpenAPISpecService {
  constructor(private repository: OpenAPISpecRepository) {}

  /**
   * Creates a new OpenAPI spec after validation
   */
  async createSpec(data: CreateOpenAPISpec): Promise<OpenAPISpec> {
    // Validate the OpenAPI spec by attempting to parse it
    try {
      await parseOpenAPISpec(data.spec);
    } catch (error) {
      throw new Error(`Invalid OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Store the spec
    return await this.repository.create(data);
  }

  /**
   * Lists all OpenAPI specs
   */
  async listSpecs(): Promise<OpenAPISpec[]> {
    return await this.repository.findAll();
  }

  /**
   * Gets a specific OpenAPI spec by ID
   */
  async getSpec(id: string): Promise<OpenAPISpec | null> {
    return await this.repository.findById(id);
  }

  /**
   * Deletes an OpenAPI spec
   */
  async deleteSpec(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Extracts operations from a stored OpenAPI spec
   */
  async getOperations(id: string): Promise<OpenAPIOperation[]> {
    const spec = await this.repository.findById(id);

    if (!spec) {
      throw new Error('OpenAPI spec not found');
    }

    return await parseOpenAPISpec(spec.spec);
  }
}
