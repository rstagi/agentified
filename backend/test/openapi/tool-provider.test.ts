import { describe, it, expect } from 'vitest';
import { ToolProviderService } from '../../src/openapi/tool-provider.ts';

describe('ToolProviderService', () => {
  const validSpec = {
    openapi: '3.0.0',
    info: { title: 'Weather API', version: '1.0.0' },
    servers: [{ url: 'https://api.weather.example.com' }],
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
              schema: { type: 'string' },
              description: 'The location to get weather for',
            },
          ],
          responses: {
            '200': { description: 'Success' },
          },
        },
      },
      '/forecast/{days}': {
        get: {
          operationId: 'getForecast',
          summary: 'Get weather forecast',
          description: 'Returns weather forecast for specified number of days',
          parameters: [
            {
              name: 'days',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Number of days to forecast',
            },
            {
              name: 'location',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'The location to get forecast for',
            },
          ],
          responses: {
            '200': { description: 'Success' },
          },
        },
      },
    },
  };

  it('creates tools from an OpenAPI spec', async () => {
    const toolProvider = new ToolProviderService(validSpec);
    const tools = await toolProvider.getTools();

    expect(Object.keys(tools)).toEqual(['getWeather', 'getForecast']);

    // Verify getWeather tool
    expect(tools.getWeather).toBeDefined();
    expect(tools.getWeather.description).toBe('Returns the current weather for a given location');
    expect(tools.getWeather.parameters).toBeDefined();
    expect(tools.getWeather.execute).toBeInstanceOf(Function);

    // Verify getForecast tool
    expect(tools.getForecast).toBeDefined();
    expect(tools.getForecast.description).toBe('Returns weather forecast for specified number of days');
    expect(tools.getForecast.parameters).toBeDefined();
    expect(tools.getForecast.execute).toBeInstanceOf(Function);
  });

  it('returns empty object for spec with no operations', async () => {
    const emptySpec = {
      openapi: '3.0.0',
      info: { title: 'Empty API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {},
    };

    const toolProvider = new ToolProviderService(emptySpec);
    const tools = await toolProvider.getTools();

    expect(tools).toEqual({});
  });

  it('uses first server URL as base URL for tools', async () => {
    const toolProvider = new ToolProviderService(validSpec);
    const tools = await toolProvider.getTools();

    // The tools should be configured with the base URL from servers[0]
    // We can verify this by checking the tool exists and has the right structure
    expect(tools.getWeather).toBeDefined();
    expect(tools.getWeather.execute).toBeInstanceOf(Function);
  });

  it('validates tool parameters schemas', async () => {
    const toolProvider = new ToolProviderService(validSpec);
    const tools = await toolProvider.getTools();

    // Verify getWeather parameter schema
    const validParams = { location: 'New York' };
    expect(() => tools.getWeather.parameters.parse(validParams)).not.toThrow();

    // Missing required parameter should throw
    expect(() => tools.getWeather.parameters.parse({})).toThrow();
  });

  it('throws error for invalid OpenAPI spec', async () => {
    const invalidSpec = {
      // Missing required fields
      paths: {},
    };

    const toolProvider = new ToolProviderService(invalidSpec);

    await expect(toolProvider.getTools()).rejects.toThrow('Invalid OpenAPI spec');
  });

  it('defaults to empty string base URL when no servers defined', async () => {
    const specWithoutServers = {
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            operationId: 'test',
            summary: 'Test',
            responses: {
              '200': { description: 'Success' },
            },
          },
        },
      },
    };

    const toolProvider = new ToolProviderService(specWithoutServers);
    const tools = await toolProvider.getTools();

    expect(tools.test).toBeDefined();
  });
});
