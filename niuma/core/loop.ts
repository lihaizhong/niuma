import type {
  AgentContext,
  AgentState,
  LLMResponse,
  ProgressEvent,
} from "./types";

export async function runLoop(
  ctx: AgentContext,
  state: AgentState,
): Promise<AgentState> {
  const { provider, tools, maxIterations, onProgress } = ctx;

  while (!state.halted && state.iteration < maxIterations) {
    state.iteration++;

    onProgress?.({
      type: "iteration",
      iteration: state.iteration,
      message: `Iteration ${state.iteration}`,
    });

    onProgress?.({
      type: "llm_call",
      iteration: state.iteration,
    });

    const response = await provider.chat({
      messages: state.messages,
      tools: tools ? tools.list().map((name) => ({ name })) : undefined,
      temperature: ctx.temperature,
    });

    onProgress?.({
      type: "llm_response",
      iteration: state.iteration,
      message: response.content,
    });

    state.messages.push({
      role: "assistant",
      content: response.content,
      toolCalls: response.toolCalls,
    });

    if (!response.hasToolCalls || !response.toolCalls) {
      state.halted = true;
      state.lastContent = response.content;
      onProgress?.({
        type: "complete",
        iteration: state.iteration,
        message: response.content,
      });
      return state;
    }

    for (const toolCall of response.toolCalls) {
      onProgress?.({
        type: "tool_start",
        iteration: state.iteration,
        toolName: toolCall.name,
      });

      const result = await tools.execute(toolCall.name, toolCall.arguments);
      state.toolResults.push(result);

      state.messages.push({
        role: "tool",
        content: result,
        toolCallId: toolCall.id,
        name: toolCall.name,
      });

      onProgress?.({
        type: "tool_result",
        iteration: state.iteration,
        toolName: toolCall.name,
        toolResult: result,
      });
    }
  }

  return state;
}
