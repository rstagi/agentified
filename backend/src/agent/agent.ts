import { convertToModelMessages, type LanguageModel, streamText, type StreamTextResult, type ToolSet, type UIMessage } from "ai";
import { type AgentModel } from "./schemas.ts";

export type ConfiguredAgent = Omit<AgentModel, "model"> & {
  model: Exclude<LanguageModel, string>,
  tools?: ToolSet,
};

export function askAgent(
  agent: ConfiguredAgent,
  chatMessages: UIMessage[]
): StreamTextResult<ToolSet, string> {
  return streamText({
    model: agent.model,
    messages: [{
      role: "system",
      content: agent.systemPrompt,
    },
    ...convertToModelMessages(chatMessages)],
    ...(agent.tools && { tools: agent.tools }),
  })
}

