import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoDBTestHelper } from '../helpers/mongodb-setup.ts';
import { OpenAPISpecService } from '../../src/openapi/service.ts';
import { OpenAPISpecRepository } from '../../src/openapi/repository.ts';

const mongoHelper = new MongoDBTestHelper();
let service: OpenAPISpecService;

beforeAll(async () => {
  await mongoHelper.setup();
  const repository = new OpenAPISpecRepository(mongoHelper.db!);
  service = new OpenAPISpecService(repository);
});

afterAll(async () => {
  await mongoHelper.teardown();
});

beforeEach(async () => {
  await mongoHelper.clearDatabase();
});

describe('OpenAPISpecService', () => {
  const validSpec = {
    openapi: '3.0.0',
    info: { title: 'Weather API', version: '1.0.0' },
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

  it('creates and validates an OpenAPI spec', async () => {
    const result = await service.createSpec({
      name: 'Weather API',
      spec: validSpec,
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Weather API');
    expect(result.spec).toEqual(validSpec);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid OpenAPI spec', async () => {
    const invalidSpec = {
      // Missing required fields
      paths: {},
    };

    await expect(
      service.createSpec({
        name: 'Invalid API',
        spec: invalidSpec,
      })
    ).rejects.toThrow('Invalid OpenAPI spec');
  });

  it('lists all specs', async () => {
    await service.createSpec({ name: 'API 1', spec: validSpec });
    await service.createSpec({ name: 'API 2', spec: validSpec });

    const specs = await service.listSpecs();

    expect(specs).toHaveLength(2);
    expect(specs.map(s => s.name)).toEqual(['API 1', 'API 2']);
  });

  it('gets a spec by ID', async () => {
    const created = await service.createSpec({ name: 'Weather API', spec: validSpec });

    const retrieved = await service.getSpec(created.id);

    expect(retrieved).toEqual(created);
  });

  it('returns null for non-existent spec', async () => {
    const retrieved = await service.getSpec('non-existent-id');

    expect(retrieved).toBeNull();
  });

  it('deletes a spec', async () => {
    const created = await service.createSpec({ name: 'Weather API', spec: validSpec });

    await service.deleteSpec(created.id);

    const retrieved = await service.getSpec(created.id);
    expect(retrieved).toBeNull();
  });

  it('extracts operations from spec', async () => {
    const created = await service.createSpec({ name: 'Weather API', spec: validSpec });

    const operations = await service.getOperations(created.id);

    expect(operations).toHaveLength(1);
    expect(operations[0].operationId).toBe('getWeather');
    expect(operations[0].method).toBe('get');
    expect(operations[0].path).toBe('/weather');
  });

  it('throws error when getting operations for non-existent spec', async () => {
    await expect(service.getOperations('non-existent-id')).rejects.toThrow(
      'OpenAPI spec not found'
    );
  });
});
