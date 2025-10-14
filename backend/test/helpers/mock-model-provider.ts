import { MockLanguageModelV2 } from 'ai/test';
import { simulateReadableStream } from 'ai';
import { ModelProvider } from '../../src/agent/models.ts';

export class MockModelProvider extends ModelProvider {
  private mockResponse: string = 'Hello from mock agent!';

  constructor(mockResponse = 'Hello from mock agent!') {
    // Call super with dummy config - won't be used
    super({
      openai: { apiKey: 'mock' },
      anthropic: { apiKey: 'mock' },
      google: { apiKey: 'mock' }
    });
    this.mockResponse = mockResponse;
  }

  toLanguageModel() {
    return new MockLanguageModelV2({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: 'text-start', id: 'text-1' },
            ...this.mockResponse.split(' ').map(word => ({
              type: 'text-delta' as const, id: 'text-1', delta: word,
            })),
            { type: 'text-end', id: 'text-1' },
            {
              type: 'finish',
              finishReason: 'stop',
              logprobs: undefined,
              usage: { inputTokens: 3, outputTokens: 10, totalTokens: 13 },
            },
          ],
        }),
      }),
    });
  }
}

