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
    schema?: any;
    description?: string;
  }>;
  requestBody?: any;
};

export async function parseOpenAPISpec(spec: any): Promise<OpenAPIOperation[]> {
  // Validate the spec
  const result = await validate(spec);

  if (!result.valid) {
    throw new Error(`Invalid OpenAPI spec: ${result.errors?.map(e => e.message).join(', ')}`);
  }

  const operations: OpenAPIOperation[] = [];
  const paths = spec.paths || {};

  // Extract all operations from all paths
  for (const [path, pathItem] of Object.entries(paths)) {
    const pathObj = pathItem as any;

    // Check all HTTP methods
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

    for (const method of methods) {
      if (pathObj[method]) {
        const operation = pathObj[method];

        operations.push({
          operationId: operation.operationId,
          method,
          path,
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters,
          requestBody: operation.requestBody,
        });
      }
    }
  }

  return operations;
}
