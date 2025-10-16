# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack AI agent application with a React frontend and Fastify backend. The application provides a chat interface for interacting with multiple LLM providers (OpenAI, Anthropic, Google).

## Architecture

### Backend (Fastify + TypeScript)

- **Server Framework**: Fastify with Zod type validation
- **Database**: MongoDB (accessed via @fastify/mongodb)
- **LLM Integration**: Vercel AI SDK (`ai` package) for unified model access
- **Model Providers**: Configured via `ModelProvider` class (backend/src/agent/models.ts)
  - OpenAI (via @ai-sdk/openai)
  - Anthropic (via @ai-sdk/anthropic)
  - Google Generative AI (via @ai-sdk/google)

**Key Backend Files**:
- `backend/src/server.ts`: Server builder, registers plugins and routes
- `backend/src/index.ts`: Entry point, starts server
- `backend/src/config.ts`: Configuration management (env vars + JSON config)
- `backend/src/agent/agent.ts`: Core agent logic using `streamText` from AI SDK
- `backend/src/agent/routes.ts`: Agent API routes (`/agent/chat`)
- `backend/src/agent/models.ts`: `ModelProvider` plugin for LLM access
- `backend/src/agent/schemas.ts`: Zod schemas and valid model definitions

**Plugin System**: The backend uses Fastify plugins:
- `modelProviderPlugin`: Decorates Fastify instance with `modelProvider` for LLM access
- MongoDB plugin for database access
- CORS plugin for cross-origin requests

### Frontend (React + Vite + TypeScript)

- **Framework**: React 19 with Vite
- **UI Components**: Custom AI-focused components in `frontend/src/components/ai-elements/`
- **Styling**: Tailwind CSS with Radix UI components
- **LLM Integration**: Vercel AI SDK React hooks (`@ai-sdk/react`)

**Key Frontend Files**:
- `frontend/src/App.tsx`: Main app component (renders Chat)
- `frontend/src/components/Chat.tsx`: Main chat interface using `useChat` hook
- `frontend/src/components/ai-elements/`: Specialized components for AI interactions
  - `conversation.tsx`: Conversation container
  - `message.tsx`: Message display
  - `prompt-input.tsx`: User input with attachments and model selection
  - `response.tsx`: AI response rendering
  - `reasoning.tsx`: Reasoning display (for models with reasoning)

## Development Commands

### Full Stack Development

```bash
# Start both frontend and backend with MongoDB (recommended)
./start-dev.sh
```

This script:
- Starts/creates MongoDB container on port 27017
- Starts backend on port 8080 (or finds alternative if occupied)
- Starts frontend on port 5173 (Vite default)

### Backend Only

```bash
cd backend

# Development with hot reload
ENV=development CONFIG_PATH=config/dev.json npm run dev

# Run tests
npm test

# Watch mode tests
npm run test:watch

# Test UI
npm run test:ui

# Production start
npm start
```

### Frontend Only

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

## Configuration

Backend configuration uses a layered approach (backend/src/config.ts):
1. Environment variables take precedence
2. Falls back to JSON config file (specify via `CONFIG_PATH` env var)

**Required Configuration**:
- `mongoDbUrl`: MongoDB connection URL
- `openaiApiKey`: OpenAI API key
- `anthropicApiKey`: Anthropic API key
- `googleApiKey`: Google API key

**Optional Configuration**:
- `port`: Server port (default: 8080)
- `logLevel`: Logging level (default: "info")
- `mongoDbName`: Database name (default: "some_db")

**Development Config**: See `backend/config/dev.json` for example (note: API keys must be added via env vars)

## Testing

Backend uses Vitest with:
- **Unit tests**: `backend/test/**/*.test.ts`
- **Evaluations**: `backend/test/**/*.eval.ts`
- **Test helpers**: MongoDB setup via testcontainers, mock model providers
- **Timeout**: 60s for tests and hooks (testcontainers can be slow)

## Model Configuration

Valid models are defined in `backend/src/agent/schemas.ts`:
- **OpenAI**: gpt-5, gpt-5-mini, gpt-5-nano, gpt-4.1-mini, gpt-4.1-nano
- **Google**: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-lite, gemini-2.0-*
- **Anthropic**: claude-sonnet-3.7, claude-sonnet-4, claude-haiku-3.5, claude-opus-4, claude-opus-4.1

The `ModelProvider` class routes model requests to the appropriate provider based on model name prefix/pattern.

## Key Design Patterns

### Agent Interaction Flow

1. Frontend sends chat messages to `/agent/chat` via `useChat` hook
2. Backend validates messages with AI SDK's `safeValidateUIMessages`
3. Agent configuration created (system prompt + model selection)
4. `askAgent` function calls AI SDK's `streamText` with agent config
5. Response streamed back to frontend via `pipeUIMessageStreamToResponse`

### Type Safety

- Fastify uses `ZodTypeProvider` for runtime validation
- Shared Zod schemas between validation and TypeScript types
- Model types are literal unions derived from const arrays

# Code style
- We like mixing functional programming with object oriented programming. When in doubt, prefer the former over the latter
- When testing, try to avoid mocks unless strictly necessary
- Our code should follow the Domain Driven Design pattern, with all the related ones (such as Hexagonal Architecture)
- The tasks are not completed if we haven't instrumented them with OpenTelemetry and Logging, or similar metrics systems whenever applicable
- Git commits should follow the Conventional Commits guidelines
- We should never use `any`. In case we absolutely need it, we should use `unknown`

# Workflow
- When adding a new piece of software, always start by writing the test first by following the TDD paradigm:
  - write a failing test for the piece of software we'd like to implement, nothing else
  - I'll run the test to make sure it's failing (i.e. red)
  - once I confirm to you it's red, you can start implement the minimal amount of code to make the test pass
  - I'll run the test to make sure it's succeeding (i.e. green)
  - finally we'll evaluate if we want to refactor it
  - after all this, we'll commit it and push it
  - apply this workflow always, unless I explicitly tell you not to
- Be sure to typecheck when you’re done making a series of code changes
- In general, prefer running single tests, and not the whole test suite, for performance
- For features involving both frontend and backend changes, unless stated otherwise or not applicable, we should always start from the backend, making it retro-compatible, then we can implement the change on the frontend (preferably under feature flag)
