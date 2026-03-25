import { runLoop } from "./loop";

import type {
  AgentState,
  CreateAgentOptions,
  LLMResponse,
  LLMStreamChunk,
  ChatMessage,
} from "./types";

export interface Agent {
  chat(messages: ChatMessage[]): Promise<LLMResponse>;
  chatStream(messages: ChatMessage[]): AsyncIterable<LLMStreamChunk>;
  getState(): AgentState;
}

export function createAgent(options: CreateAgentOptions): Agent {
  const {
    provider,
    tools,
    maxIterations = 40,
    temperature = 0.7,
    onProgress,
  } = options;

  let state: AgentState = {
    messages: [],
    iteration: 0,
    halted: false,
    toolResults: [],
  };

  return {
    async chat(messages: ChatMessage[]): Promise<LLMResponse> {
      state = {
        messages: [...messages],
        iteration: 0,
        halted: false,
        toolResults: [],
      };

      const ctx = {
        provider,
        tools: tools!,
        maxIterations,
        temperature,
        onProgress,
      };

      state = await runLoop(ctx, state);

      return {
        content: state.lastContent || "",
        hasToolCalls: false,
      };
    },

    // eslint-disable-next-line require-yield
    async *chatStream(_messages: ChatMessage[]): AsyncIterable<LLMStreamChunk> {
      throw new Error("Stream not implemented yet");
    },

    getState(): AgentState {
      return { ...state };
    },
  };
}
