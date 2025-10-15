import { z } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import type { OpenAPIOperation } from './parser.ts';

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: z.ZodSchema;
};

/**
 * Converts an OpenAPI operation to an AI SDK tool definition
 */
export function convertOperationToTool(operation: OpenAPIOperation): ToolDefinition {
  const name = operation.operationId;
  const description = operation.description || operation.summary || '';

  // Build JSON Schema for all parameters
  const properties: Record<string, any> = {};
  const required: string[] = [];

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
    }
  }

  // Handle request body
  if (operation.requestBody) {
    const jsonContent = operation.requestBody.content?.['application/json'];
    if (jsonContent?.schema) {
      const bodySchema = jsonContent.schema;

      // If body schema is an object with properties, merge them into root
      if (bodySchema.type === 'object' && bodySchema.properties) {
        for (const [key, prop] of Object.entries(bodySchema.properties)) {
          properties[key] = prop;
        }

        // Merge required fields from body
        if (bodySchema.required) {
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

  // Evaluate the generated Zod schema code with 'z' in scope
  // The json-schema-to-zod returns a string like "z.object({...})"
  // Using Function constructor is safer than eval and allows passing z into scope
  const parameters = new Function('z', `return ${zodSchemaString}`)(z);

  return {
    name,
    description,
    parameters,
  };
}
