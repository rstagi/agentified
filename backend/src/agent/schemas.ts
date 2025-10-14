import { z } from "zod";

export const validOpenaiModels = [
  'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1-nano',
] as const;
export type ValidOpenaiModel = typeof validOpenaiModels[number];

export const validGoogleModels = [
  'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-lite',
  'gemini-2.0-pro', 'gemini-2.0-flash', 'gemini-2.0-lite',
] as const;
export type ValidGoogleModel = typeof validGoogleModels[number];

export const validAnthropicModels = [
  'claude-sonnet-3.7', 'claude-sonnet-4', 'claude-haiku-3.5',
  'claude-opus-4', 'claude-opus-4.1'
] as const;
export type ValidAnthropicModel = typeof validAnthropicModels[number];

export const validModels = [
  ...validOpenaiModels,
  ...validGoogleModels,
  ...validAnthropicModels,
];
export type ValidModel = typeof validModels[number];

// Base agent response schema (what API returns)
export const agentModelSchema = z.object({
  id: z.string(),
  systemPrompt: z.string(),
  model: z.enum(validModels),
  createdAt: z.date()
});
export type AgentModel = z.infer<typeof agentModelSchema>;

