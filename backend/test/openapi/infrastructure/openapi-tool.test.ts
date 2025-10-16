import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createToolFromOperation } from '../../../src/openapi/infrastructure/openapi-tool.ts';
import type { OpenAPIOperation } from '../../../src/openapi/infrastructure/parser.ts';

const server = setupServer();

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('createToolFromOperation', () => {
  describe('tool definition', () => {
    it('creates a tool with correct name and description', () => {
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
            schema: { type: 'string' },
            description: 'The location to get weather for',
          },
        ],
      };

      const tool = createToolFromOperation('https://api.example.com', operation);

      expect(tool.description).toBe('Returns the current weather for a given location');
      expect(tool.parameters).toBeDefined();

      // Verify the schema shape
      const parsed = tool.parameters.parse({ location: 'New York' });
      expect(parsed).toEqual({ location: 'New York' });
    });

    it('uses summary as description fallback', () => {
      const operation: OpenAPIOperation = {
        operationId: 'getWeather',
        method: 'get',
        path: '/weather',
        summary: 'Get weather data',
      };

      const tool = createToolFromOperation('https://api.example.com', operation);

      expect(tool.description).toBe('Get weather data');
    });

    it('validates required vs optional parameters', () => {
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
            schema: { type: 'string' },
            description: 'Search query',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Result limit',
          },
        ],
      };

      const tool = createToolFromOperation('https://api.example.com', operation);

      // Required parameter works
      const parsed1 = tool.parameters.parse({ q: 'test' });
      expect(parsed1.q).toBe('test');

      // Optional parameter works
      const parsed2 = tool.parameters.parse({ q: 'test', limit: 10 });
      expect(parsed2).toEqual({ q: 'test', limit: 10 });

      // Missing required parameter throws
      expect(() => tool.parameters.parse({})).toThrow();
    });
  });

  describe('tool execution', () => {
    it('executes GET request with query parameters', async () => {
      const operation: OpenAPIOperation = {
        operationId: 'getWeather',
        method: 'get',
        path: '/weather',
        parameters: [
          {
            name: 'location',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      server.use(
        http.get('https://api.example.com/weather', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('location')).toBe('New York');
          return HttpResponse.json({ temperature: 72, condition: 'sunny' });
        })
      );

      const tool = createToolFromOperation('https://api.example.com', operation);
      const result = await tool.execute({ location: 'New York' });

      expect(result).toEqual({ temperature: 72, condition: 'sunny' });
    });

    it('executes POST request with body', async () => {
      const operation: OpenAPIOperation = {
        operationId: 'createUser',
        method: 'post',
        path: '/users',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
                required: ['name', 'email'],
              },
            },
          },
        },
      };

      server.use(
        http.post('https://api.example.com/users', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ name: 'John Doe', email: 'john@example.com' });
          return HttpResponse.json({ id: '123', name: 'John Doe', email: 'john@example.com' });
        })
      );

      const tool = createToolFromOperation('https://api.example.com', operation);
      const result = await tool.execute({ name: 'John Doe', email: 'john@example.com' });

      expect(result).toEqual({ id: '123', name: 'John Doe', email: 'john@example.com' });
    });

    it('executes GET request with path parameters', async () => {
      const operation: OpenAPIOperation = {
        operationId: 'getUser',
        method: 'get',
        path: '/users/{id}',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      server.use(
        http.get('https://api.example.com/users/123', () => {
          return HttpResponse.json({ id: '123', name: 'John Doe' });
        })
      );

      const tool = createToolFromOperation('https://api.example.com', operation);
      const result = await tool.execute({ id: '123' });

      expect(result).toEqual({ id: '123', name: 'John Doe' });
    });

    it('executes request with both path and query parameters', async () => {
      const operation: OpenAPIOperation = {
        operationId: 'getUserPosts',
        method: 'get',
        path: '/users/{id}/posts',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
      };

      server.use(
        http.get('https://api.example.com/users/123/posts', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).toBe('10');
          return HttpResponse.json([{ id: '1', title: 'Post 1' }]);
        })
      );

      const tool = createToolFromOperation('https://api.example.com', operation);
      const result = await tool.execute({ id: '123', limit: 10 });

      expect(result).toEqual([{ id: '1', title: 'Post 1' }]);
    });

    it('throws error on HTTP error response', async () => {
      const operation: OpenAPIOperation = {
        operationId: 'getUser',
        method: 'get',
        path: '/users/{id}',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      server.use(
        http.get('https://api.example.com/users/999', () => {
          return HttpResponse.json({ error: 'User not found' }, { status: 404 });
        })
      );

      const tool = createToolFromOperation('https://api.example.com', operation);

      await expect(tool.execute({ id: '999' })).rejects.toThrow();
    });
  });
});
