import type { LLMProvider, LLMConfig, LLMResponse, ChatOptions } from "./base";
import type { ChatMessage, ToolDefinition, ToolCall } from "../types/llm";

interface OpenAICompatibleConfig extends LLMConfig {
  apiBase?: string;
  organization?: string;
}

export abstract class OpenAICompatibleProvider implements LLMProvider {
  abstract readonly name: string;
  protected config: OpenAICompatibleConfig;

  constructor(config: OpenAICompatibleConfig) {
    this.config = config;
  }

  getConfig(): LLMConfig {
    return this.config;
  }

  abstract getDefaultModel(): string;

  protected abstract getApiBase(): string;

  async chat(options: ChatOptions): Promise<LLMResponse> {
    const response = await fetch(`${this.getApiBase()}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(this.buildRequestBody(options)),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: ToolCall[];
        };
        finish_reason?: string;
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    return this.parseResponse(data);
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    if (this.config.organization) {
      headers["OpenAI-Organization"] = this.config.organization;
    }
    return headers;
  }

  protected buildRequestBody(options: ChatOptions): unknown {
    return {
      model: options.model || this.config.model,
      messages: this.convertMessages(options.messages),
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      top_p: options.topP ?? this.config.topP,
      stop: options.stopSequences ?? this.config.stopSequences,
      frequency_penalty:
        options.frequencyPenalty ?? this.config.frequencyPenalty,
      presence_penalty:
        options.presencePenalty ?? this.config.presencePenalty,
      tools: options.tools?.map((t) => this.convertToolDefinition(t)),
    };
  }

  protected convertMessages(messages: ChatMessage[]): unknown[] {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
      name: m.name,
      tool_calls: m.toolCalls,
      tool_call_id: m.toolCallId,
    }));
  }

  protected convertToolDefinition(tool: ToolDefinition): unknown {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  }

  protected parseResponse(data: {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: ToolCall[];
      };
      finish_reason?: string;
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  }): LLMResponse {
    const choice = data.choices?.[0];
    const message = choice?.message;
    const toolCalls = message?.tool_calls;

    return {
      content: message?.content || "",
      toolCalls,
      hasToolCalls: !!toolCalls && toolCalls.length > 0,
      usage: data.usage
        ? {
            inputTokens: data.usage.prompt_tokens || 0,
            outputTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
      finishReason: choice?.finish_reason,
    };
  }
}
