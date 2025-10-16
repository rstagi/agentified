import { evalite } from "evalite";
import { askAgent, type ConfiguredAgent } from "../../src/agent/agent.ts";
import { type UIMessage } from "ai";
import { type AgentModel } from "../../src/agent/schemas.ts";
import { testModelProvider } from "../helpers/test-model-provider.ts";
import { z } from "zod";

let toolWasCalled = false;

evalite("agent with tools eval", {
  data: async (): Promise<{ input: { agent: AgentModel, messages: UIMessage[]; }; }[]> => {
    return [
      {
        input: {
          agent: {
            id: "1",
            systemPrompt: "You are a helpful weather assistant. Use the getWeather tool to answer questions about weather.",
            model: "gpt-4.1-nano",
            createdAt: new Date(),
          },
          messages: [{
            id: "1",
            role: "user",
            parts: [{
              type: "text",
              text: "What's the weather in San Francisco?",
            }],
          }],
        },
      }
    ];
  },
  task: async ({ agent, messages }) => {
    toolWasCalled = false;

    const configuredAgent: ConfiguredAgent = {
      ...agent,
      model: testModelProvider().toLanguageModel(agent.model),
      tools: {
        getWeather: {
          description: 'Get the current weather for a location',
          inputSchema: z.object({
            location: z.string().describe('The city and state, e.g. San Francisco, CA'),
          }),
          execute: async ({ location }: { location: string }) => {
            toolWasCalled = true;
            return {
              location,
              temperature: 72,
              condition: 'sunny',
            };
          },
        },
      },
    };

    return askAgent(configuredAgent, messages).text;
  },
  scorers: [
    {
      name: "ToolWasCalled",
      description: "Checks if the getWeather tool was called",
      scorer: () => {
        console.log("Tool was called:", toolWasCalled);
        return toolWasCalled ? 1 : 0;
      }
    },
  ],
});
