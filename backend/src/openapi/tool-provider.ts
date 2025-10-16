import { parseOpenAPISpec } from './infrastructure/parser.ts';
import { createToolFromOperation, type OpenAPITool } from './infrastructure/openapi-tool.ts';

/**
 * Service for converting OpenAPI specs into executable tools.
 * Takes a spec and produces a map of tools by operationId.
 */
export class ToolProviderService {
  constructor(private spec: unknown) {}

  /**
   * Parses the OpenAPI spec and converts all operations to tools.
   * Returns a map of tools keyed by operationId.
   */
  async getTools(): Promise<Record<string, OpenAPITool>> {
    // Parse and validate the spec
    const operations = await parseOpenAPISpec(this.spec);

    // Extract base URL from servers
    const specObj = this.spec as Record<string, unknown>;
    const servers = specObj.servers as Array<Record<string, unknown>> | undefined;
    const baseUrl = servers?.[0]?.url as string | undefined || '';

    // Convert each operation to a tool
    const tools: Record<string, OpenAPITool> = {};

    for (const operation of operations) {
      const tool = createToolFromOperation(baseUrl, operation);
      tools[operation.operationId] = tool;
    }

    return tools;
  }
}
