import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoDBTestHelper } from '../helpers/mongodb-setup.ts';
import fastify from 'fastify';
import { type ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import openapiRoutes from '../../src/openapi/routes.ts';

const mongoHelper = new MongoDBTestHelper();
const server = fastify({
  logger: false,
}).withTypeProvider<ZodTypeProvider>();

beforeAll(async () => {
  await mongoHelper.setup();

  // Set up Zod validation
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // Register MongoDB plugin
  await server.register(import('@fastify/mongodb'), {
    forceClose: true,
    url: mongoHelper.getConnectionString(),
    database: mongoHelper.getDatabaseName(),
    directConnection: true,
  });

  // Register OpenAPI routes
  await server.register(openapiRoutes, {
    prefix: '/openapi',
  });

  await server.ready();
});

afterAll(async () => {
  await server.close();
  await mongoHelper.teardown();
});

beforeEach(async () => {
  await mongoHelper.clearDatabase();
});

describe('OpenAPI Spec Routes', () => {
  const validSpec = {
    openapi: '3.0.0',
    info: { title: 'Weather API', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      '/weather': {
        get: {
          operationId: 'getWeather',
          summary: 'Get weather',
          parameters: [
            {
              name: 'location',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Success' },
          },
        },
      },
    },
  };

  describe('POST /openapi/specs', () => {
    it('creates a new OpenAPI spec', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: {
          name: 'Weather API',
          spec: validSpec,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Weather API');
      expect(body.spec).toEqual(validSpec);
      expect(body.createdAt).toBeDefined();
    });

    it('returns 400 for invalid OpenAPI spec', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: {
          name: 'Invalid API',
          spec: { paths: {} }, // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('returns 400 for missing name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: {
          spec: validSpec,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /openapi/specs', () => {
    it('lists all OpenAPI specs', async () => {
      // Create two specs
      await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: { name: 'API 1', spec: validSpec },
      });
      await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: { name: 'API 2', spec: validSpec },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/openapi/specs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body.map((s: { name: string }) => s.name)).toEqual(['API 1', 'API 2']);
    });

    it('returns empty array when no specs exist', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/openapi/specs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });
  });

  describe('GET /openapi/specs/:id', () => {
    it('returns a specific OpenAPI spec', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: { name: 'Weather API', spec: validSpec },
      });
      const created = JSON.parse(createResponse.body);

      const response = await server.inject({
        method: 'GET',
        url: `/openapi/specs/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual(created);
    });

    it('returns 404 for non-existent spec', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/openapi/specs/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /openapi/specs/:id', () => {
    it('deletes an OpenAPI spec', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: { name: 'Weather API', spec: validSpec },
      });
      const created = JSON.parse(createResponse.body);

      const deleteResponse = await server.inject({
        method: 'DELETE',
        url: `/openapi/specs/${created.id}`,
      });

      expect(deleteResponse.statusCode).toBe(204);

      // Verify it's deleted
      const getResponse = await server.inject({
        method: 'GET',
        url: `/openapi/specs/${created.id}`,
      });
      expect(getResponse.statusCode).toBe(404);
    });

    it('returns 404 when deleting non-existent spec', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/openapi/specs/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /openapi/specs/:id/operations', () => {
    it('returns operations from a spec', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/openapi/specs',
        payload: { name: 'Weather API', spec: validSpec },
      });
      const created = JSON.parse(createResponse.body);

      const response = await server.inject({
        method: 'GET',
        url: `/openapi/specs/${created.id}/operations`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].operationId).toBe('getWeather');
      expect(body[0].method).toBe('get');
      expect(body[0].path).toBe('/weather');
    });

    it('returns 404 for non-existent spec', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/openapi/specs/non-existent-id/operations',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
