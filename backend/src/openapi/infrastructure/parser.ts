import { validate } from '@scalar/openapi-parser';

export type OpenAPIOperation = {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: unknown;
    description?: string;
  }>;
  requestBody?: unknown;
};

export async function parseOpenAPISpec(spec: unknown): Promise<OpenAPIOperation[]> {
  // Validate the spec
  const result = await validate(spec);

  if (!result.valid) {
    throw new Error(`Invalid OpenAPI spec: ${result.errors?.map(e => e.message).join(', ')}`);
  }

  const operations: OpenAPIOperation[] = [];
  const paths = (spec as Record<string, unknown>).paths || {};

  // Extract all operations from all paths
  for (const [path, pathItem] of Object.entries(paths as Record<string, unknown>)) {
    const pathObj = pathItem as Record<string, unknown>;

    // Check all HTTP methods
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

    for (const method of methods) {
      if (pathObj[method]) {
        const operation = pathObj[method] as Record<string, unknown>;

        operations.push({
          operationId: operation.operationId as string,
          method,
          path,
          summary: operation.summary as string | undefined,
          description: operation.description as string | undefined,
          parameters: operation.parameters as OpenAPIOperation['parameters'],
          requestBody: operation.requestBody,
        });
      }
    }
  }

  return operations;
}
