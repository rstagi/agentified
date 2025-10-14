import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoDBTestHelper } from '../../helpers/mongodb-setup.ts';
import { MockModelProvider } from '../../helpers/mock-model-provider.ts';
import { build } from '../../../src/server.ts';
import type { Config } from '../../../src/config.ts';
import { type TypedFastify } from '../../../src/types.js';
import { testConfig } from '../../test-config.ts';
import { readUIMessageStream, type UIMessage } from 'ai';

// Shared setup for all agent route tests
const mongoHelper = new MongoDBTestHelper();
let server: TypedFastify;

beforeAll(async () => {
  await mongoHelper.setup();

  const config: Config = {
    ...testConfig,
    port: 0,
    logLevel: 'error',
    mongoDbUrl: mongoHelper.getConnectionString(),
    mongoDbName: mongoHelper.db!.databaseName,
  };

  server = await build(config);
  await server.ready();
});

afterAll(async () => {
  await server.close();
  await mongoHelper.teardown();
});

beforeEach(async () => {
  await mongoHelper.clearDatabase();
});

const testMessages: UIMessage[] = [{
  role: 'user',
  id: '1',
  parts: [{
    type: "text",
    text: "Hello there!",
  }]
}];

describe('POST /agent/chat', () => {
  it('streams chat response', async () => {
    // Override the model provider with mock
    const mockProvider = new MockModelProvider('Hello from test agent!');
    server.modelProvider = mockProvider;

    // Test chat request
    const response = await server.inject({
      method: 'POST',
      url: `/agent/chat`,
      payload: {
        messages: testMessages,
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.body).toMatchSnapshot();
  });
});

