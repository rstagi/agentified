import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoDBTestHelper } from '../helpers/mongodb-setup.ts';
import fastify from 'fastify';
import { type ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import openapiToolsPlugin from '../../src/openapi/plugin.ts';
import { OpenAPISpecRepository } from '../../src/openapi/repository.ts';
import { OpenAPISpecService } from '../../src/openapi/service.ts';

const mongoHelper = new MongoDBTestHelper();

describe('OpenAPI Tools Plugin', () => {
  let server: ReturnType<typeof fastify>;
  let repository: OpenAPISpecRepository;
  let service: OpenAPISpecService;

  beforeAll(async () => {
    await mongoHelper.setup();
  });

  afterAll(async () => {
    await mongoHelper.teardown();
  });

  beforeEach(async () => {
    await mongoHelper.clearDatabase();

    server = fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    server.setValidatorCompiler(validatorCompiler);
    server.setSerializerCompiler(serializerCompiler);

    await server.register(import('@fastify/mongodb'), {
      forceClose: true,
      url: mongoHelper.getConnectionString(),
      database: mongoHelper.getDatabaseName(),
      directConnection: true,
    });

    await server.register(openapiToolsPlugin);

    await server.ready();

    repository = new OpenAPISpecRepository(server.mongo.db!);
    service = new OpenAPISpecService(repository);
  });

  afterEach(async () => {
    await server.close();
  });

  it('decorates fastify instance with openapiTools', async () => {
    expect(server.openapiTools).toBeDefined();
    expect(server.openapiTools.getToolsBySpecId).toBeInstanceOf(Function);
  });

  it('fails to register without MongoDB plugin', async () => {
    const serverWithoutMongo = fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();

    await expect(
      serverWithoutMongo.register(openapiToolsPlugin)
    ).rejects.toThrow();

    await serverWithoutMongo.close();
  });

  it('loads tools from a spec by ID', async () => {
    const validSpec = {
      openapi: '3.0.0',
      info: { title: 'Weather API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/weather': {
          get: {
            operationId: 'getWeather',
            summary: 'Get weather',
            description: 'Returns current weather',
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

    const created = await service.createSpec({ name: 'Weather API', spec: validSpec });

    const tools = await server.openapiTools.getToolsBySpecId(created.id);

    expect(Object.keys(tools)).toEqual(['getWeather']);
    expect(tools.getWeather.description).toBe('Returns current weather');
    expect(tools.getWeather.parameters).toBeDefined();
    expect(tools.getWeather.execute).toBeInstanceOf(Function);
  });

  it('throws error for non-existent spec ID', async () => {
    await expect(
      server.openapiTools.getToolsBySpecId('non-existent-id')
    ).rejects.toThrow('OpenAPI spec not found');
  });

  it('returns empty object for spec with no operations', async () => {
    const emptySpec = {
      openapi: '3.0.0',
      info: { title: 'Empty API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {},
    };

    const created = await service.createSpec({ name: 'Empty API', spec: emptySpec });

    const tools = await server.openapiTools.getToolsBySpecId(created.id);

    expect(tools).toEqual({});
  });
});
