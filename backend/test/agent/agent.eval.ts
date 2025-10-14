import { evalite } from "evalite";
import { askAgent, type ConfiguredAgent } from "../../src/agent/agent.ts";
import { type UIMessage } from "ai";
import { type AgentModel } from "../../src/agent/schemas.ts";
import { testModelProvider } from "../helpers/test-model-provider.ts";

evalite("agent eval", {
  data: async (): Promise<{ input: { agent: AgentModel, messages: UIMessage[]; }; expected: string }[]> => {
    return [
      {
        input: {
          agent: {
            id: "1",
            systemPrompt: "You are a helpful agent.",
            model: "gpt-4.1-nano",
            createdAt: new Date(),
          },
          messages: [{
            id: "1",
            role: "user",
            parts: [{
              type: "text",
              text: "Hello there!",
            }],
          }],
        },
        expected: "Hello! How can I assist you today?",
      }
    ];
  },
  task: async ({ agent, messages }) => {
    const configuredAgent: ConfiguredAgent = {
      ...agent,
      model: testModelProvider().toLanguageModel(agent.model),
    };
    return askAgent(configuredAgent, messages).text;
  },
  scorers: [
    {
      name: "Dummy",
      description: "Checks if the text is not empty",
      scorer: ({ output }) => {
        console.log("Got output", output);
        return output.length > 0 ? 1 : 0;
      }
    },
  ],
});

