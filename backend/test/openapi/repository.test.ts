import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoDBTestHelper } from '../helpers/mongodb-setup.ts';
import { OpenAPISpecRepository } from '../../src/openapi/repository.ts';

const mongoHelper = new MongoDBTestHelper();
let repository: OpenAPISpecRepository;

beforeAll(async () => {
  await mongoHelper.setup();
  repository = new OpenAPISpecRepository(mongoHelper.db!);
});

afterAll(async () => {
  await mongoHelper.teardown();
});

beforeEach(async () => {
  await mongoHelper.clearDatabase();
});

describe('OpenAPISpecRepository', () => {
  it('creates and retrieves an OpenAPI spec', async () => {
    const spec = {
      name: 'Weather API',
      spec: {
        openapi: '3.0.0',
        info: { title: 'Weather API', version: '1.0.0' },
        paths: {},
      },
    };

    const created = await repository.create(spec);

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Weather API');
    expect(created.spec).toEqual(spec.spec);
    expect(created.createdAt).toBeInstanceOf(Date);

    const retrieved = await repository.findById(created.id);
    expect(retrieved).toEqual(created);
  });

  it('lists all OpenAPI specs', async () => {
    await repository.create({
      name: 'API 1',
      spec: { openapi: '3.0.0', info: { title: 'API 1', version: '1.0.0' }, paths: {} },
    });

    await repository.create({
      name: 'API 2',
      spec: { openapi: '3.0.0', info: { title: 'API 2', version: '1.0.0' }, paths: {} },
    });

    const specs = await repository.findAll();

    expect(specs).toHaveLength(2);
    expect(specs.map(s => s.name)).toEqual(['API 1', 'API 2']);
  });

  it('deletes an OpenAPI spec', async () => {
    const created = await repository.create({
      name: 'Weather API',
      spec: { openapi: '3.0.0', info: { title: 'Weather API', version: '1.0.0' }, paths: {} },
    });

    await repository.delete(created.id);

    const retrieved = await repository.findById(created.id);
    expect(retrieved).toBeNull();
  });

  it('returns null for non-existent spec', async () => {
    const retrieved = await repository.findById('non-existent-id');
    expect(retrieved).toBeNull();
  });
});
