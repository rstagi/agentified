import { describe, it, expect } from 'vitest';
import { parseOpenAPISpec } from '../../../src/openapi/infrastructure/parser.ts';

describe('parseOpenAPISpec', () => {
  it('parses a simple OpenAPI spec and extracts operations', async () => {
    const simpleSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Weather API',
        version: '1.0.0',
      },
      paths: {
        '/weather': {
          get: {
            operationId: 'getWeather',
            summary: 'Get current weather',
            description: 'Returns the current weather for a given location',
            parameters: [
              {
                name: 'location',
                in: 'query',
                required: true,
                schema: {
                  type: 'string',
                },
                description: 'The location to get weather for',
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        temperature: { type: 'number' },
                        condition: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const operations = await parseOpenAPISpec(simpleSpec);

    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      operationId: 'getWeather',
      method: 'get',
      path: '/weather',
      summary: 'Get current weather',
      description: 'Returns the current weather for a given location',
      parameters: [
        {
          name: 'location',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'The location to get weather for',
        },
      ],
    });
  });

  it('handles OpenAPI spec with multiple paths and operations', async () => {
    const multiOpSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Multi API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            operationId: 'listUsers',
            summary: 'List users',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
          post: {
            operationId: 'createUser',
            summary: 'Create a user',
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
        '/users/{id}': {
          get: {
            operationId: 'getUser',
            summary: 'Get a user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      },
    };

    const operations = await parseOpenAPISpec(multiOpSpec);

    expect(operations).toHaveLength(3);
    expect(operations.map(op => op.operationId)).toEqual([
      'listUsers',
      'createUser',
      'getUser',
    ]);
  });

  it('throws error for invalid OpenAPI spec', async () => {
    const invalidSpec = {
      // Missing required fields
      paths: {},
    };

    await expect(parseOpenAPISpec(invalidSpec)).rejects.toThrow();
  });
});
