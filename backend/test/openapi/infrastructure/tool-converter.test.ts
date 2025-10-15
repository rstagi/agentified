import { describe, it, expect } from 'vitest';
import { convertOperationToTool } from '../../../src/openapi/infrastructure/tool-converter.ts';
import type { OpenAPIOperation } from '../../../src/openapi/infrastructure/parser.ts';

describe('convertOperationToTool', () => {
  it('converts a simple GET operation to AI SDK tool format', () => {
    const operation: OpenAPIOperation = {
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
    };

    const tool = convertOperationToTool(operation);

    expect(tool.name).toBe('getWeather');
    expect(tool.description).toBe('Returns the current weather for a given location');
    expect(tool.parameters).toBeDefined();

    // Verify the schema shape
    const parsed = tool.parameters.parse({ location: 'New York' });
    expect(parsed).toEqual({ location: 'New York' });
  });

  it('converts POST operation with request body', () => {
    const operation: OpenAPIOperation = {
      operationId: 'createUser',
      method: 'post',
      path: '/users',
      summary: 'Create a user',
      description: 'Creates a new user in the system',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'User name',
                },
                email: {
                  type: 'string',
                  description: 'User email',
                },
              },
              required: ['name', 'email'],
            },
          },
        },
      },
    };

    const tool = convertOperationToTool(operation);

    expect(tool.name).toBe('createUser');
    expect(tool.description).toBe('Creates a new user in the system');

    // Verify the schema validates correctly
    const parsed = tool.parameters.parse({
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(parsed).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
    });

    // Should reject missing required fields
    expect(() => tool.parameters.parse({ name: 'John' })).toThrow();
  });

  it('converts operation with path parameters', () => {
    const operation: OpenAPIOperation = {
      operationId: 'getUser',
      method: 'get',
      path: '/users/{id}',
      summary: 'Get user by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'User ID',
        },
      ],
    };

    const tool = convertOperationToTool(operation);

    expect(tool.name).toBe('getUser');

    const parsed = tool.parameters.parse({ id: '123' });
    expect(parsed).toEqual({ id: '123' });
  });

  it('converts operation with multiple parameter types', () => {
    const operation: OpenAPIOperation = {
      operationId: 'searchUsers',
      method: 'get',
      path: '/users',
      summary: 'Search users',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'Search query',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
          },
          description: 'Result limit',
        },
      ],
    };

    const tool = convertOperationToTool(operation);

    // Required parameter works
    const parsed1 = tool.parameters.parse({ q: 'test' });
    expect(parsed1.q).toBe('test');

    // Optional parameter works
    const parsed2 = tool.parameters.parse({ q: 'test', limit: 10 });
    expect(parsed2).toEqual({ q: 'test', limit: 10 });

    // Missing required parameter throws
    expect(() => tool.parameters.parse({})).toThrow();
  });

  it('uses summary as description fallback', () => {
    const operation: OpenAPIOperation = {
      operationId: 'getWeather',
      method: 'get',
      path: '/weather',
      summary: 'Get weather data',
      // No description field
    };

    const tool = convertOperationToTool(operation);

    expect(tool.description).toBe('Get weather data');
  });
});
