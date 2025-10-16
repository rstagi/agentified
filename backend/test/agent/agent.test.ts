import { describe, it, expect } from 'vitest';
import { askAgent, type ConfiguredAgent } from '../../src/agent/agent.ts';
import { testModelProvider } from '../helpers/test-model-provider.ts';
import { z } from 'zod';

describe('askAgent', () => {
  const modelProvider = testModelProvider();

  const baseAgent: ConfiguredAgent = {
    id: 'test-agent',
    systemPrompt: 'You are a helpful assistant.',
    model: modelProvider.toLanguageModel('gpt-5-nano'),
    createdAt: new Date(),
  };

  it('calls streamText with messages', () => {
    const messages = [
      {
        role: 'user' as const,
        id: '1',
        parts: [{ type: 'text' as const, text: 'Hello!' }],
      },
    ];

    const result = askAgent(baseAgent, messages);

    expect(result).toBeDefined();
    expect(result.pipeUIMessageStreamToResponse).toBeInstanceOf(Function);
  });

  it('accepts optional tools in agent config', () => {
    const messages = [
      {
        role: 'user' as const,
        id: '1',
        parts: [{ type: 'text' as const, text: 'What is the weather?' }],
      },
    ];

    const agentWithTools: ConfiguredAgent = {
      ...baseAgent,
      tools: {
        getWeather: {
          description: 'Get the current weather',
          inputSchema: z.object({
            location: z.string(),
          }),
          execute: async (args: { location: string }) => {
            return { temperature: 72, condition: 'sunny', location: args.location };
          },
        },
      },
    };

    const result = askAgent(agentWithTools, messages);

    expect(result).toBeDefined();
    expect(result.pipeUIMessageStreamToResponse).toBeInstanceOf(Function);
  });

  it('works without tools parameter (backward compatibility)', () => {
    const messages = [
      {
        role: 'user' as const,
        id: '1',
        parts: [{ type: 'text' as const, text: 'Hello!' }],
      },
    ];

    const result = askAgent(baseAgent, messages);

    expect(result).toBeDefined();
    expect(result.pipeUIMessageStreamToResponse).toBeInstanceOf(Function);
  });
});
