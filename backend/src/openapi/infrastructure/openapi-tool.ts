import { z } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import type { OpenAPIOperation } from './parser.ts';

export type OpenAPITool = {
  description: string;
  parameters: z.ZodSchema;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Creates a unified tool from an OpenAPI operation.
 * The tool includes both the schema definition and execution logic,
 * ensuring a single source of truth for parameter mapping.
 */
export function createToolFromOperation(
  baseUrl: string,
  operation: OpenAPIOperation
): OpenAPITool {
  const description = operation.description || operation.summary || '';

  // Build JSON Schema for all parameters - this is our single source of truth
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  // Collect parameter metadata for execution
  const parameterMapping: Record<string, { in: string }> = {};

  // Handle parameters (query, path, header, etc.)
  if (operation.parameters) {
    for (const param of operation.parameters) {
      properties[param.name] = {
        ...param.schema,
        description: param.description,
      };

      if (param.required) {
        required.push(param.name);
      }

      // Store where this parameter should go during execution
      parameterMapping[param.name] = { in: param.in };
    }
  }

  // Handle request body
  const bodyPropertyNames: string[] = [];
  if (operation.requestBody) {
    const requestBody = operation.requestBody as Record<string, unknown>;
    const content = requestBody.content as Record<string, unknown> | undefined;
    const jsonContent = content?.['application/json'] as Record<string, unknown> | undefined;

    if (jsonContent?.schema) {
      const bodySchema = jsonContent.schema as Record<string, unknown>;

      // If body schema is an object with properties, merge them into root
      if (bodySchema.type === 'object' && bodySchema.properties) {
        for (const [key, prop] of Object.entries(bodySchema.properties as Record<string, unknown>)) {
          properties[key] = prop;
          bodyPropertyNames.push(key);
        }

        // Merge required fields from body
        if (Array.isArray(bodySchema.required)) {
          required.push(...bodySchema.required);
        }
      }
    }
  }

  // Create JSON Schema object
  const jsonSchema = {
    type: 'object' as const,
    properties,
    ...(required.length > 0 && { required }),
  };

  // Convert to Zod schema
  const zodSchemaString = jsonSchemaToZod(jsonSchema);
  const parameters = new Function('z', `return ${zodSchemaString}`)(z);

  // Create the execute function with access to operation metadata
  const execute = async (args: Record<string, unknown>): Promise<unknown> => {
    // Build the URL with path and query parameters
    let path = operation.path;
    const queryParams = new URLSearchParams();
    const bodyParams: Record<string, unknown> = {};

    // Process each argument using our parameter mapping
    for (const [key, value] of Object.entries(args)) {
      if (value === undefined) continue;

      const mapping = parameterMapping[key];

      if (mapping?.in === 'path') {
        // Replace path parameter
        path = path.replace(`{${key}}`, String(value));
      } else if (mapping?.in === 'query') {
        // Add query parameter
        queryParams.append(key, String(value));
      } else if (bodyPropertyNames.includes(key)) {
        // Add to body
        bodyParams[key] = value;
      }
    }

    // Build the full URL
    const url = new URL(path, baseUrl);
    url.search = queryParams.toString();

    // Prepare request options
    const requestOptions: RequestInit = {
      method: operation.method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add body for methods that support it
    if (['post', 'put', 'patch'].includes(operation.method.toLowerCase()) && Object.keys(bodyParams).length > 0) {
      requestOptions.body = JSON.stringify(bodyParams);
    }

    // Make the HTTP request
    const response = await fetch(url.toString(), requestOptions);

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse and return the response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  };

  return {
    description,
    parameters,
    execute,
  };
}
