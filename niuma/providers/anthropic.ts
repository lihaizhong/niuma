import type { LLMProvider, LLMConfig, LLMResponse, ChatOptions } from "./base";
import type { ChatMessage, ToolDefinition } from "../types/llm";

interface AnthropicConfig extends LLMConfig {
  apiKey?: string;
  apiBase?: string;
}

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = config;
  }

  getConfig(): LLMConfig {
    return this.config;
  }

  getDefaultModel(): string {
    return "claude-3-5-sonnet-20241022";
  }

  async chat(options: ChatOptions): Promise<LLMResponse> {
    const response = await fetch(`${this.config.apiBase || "https://api.anthropic.com/v1"}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(this.buildRequestBody(options)),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    return this.parseResponse(data);
  }

  private buildRequestBody(options: ChatOptions): unknown {
    return {
      model: options.model || this.config.model,
      messages: this.convertMessages(options.messages),
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      top_p: options.topP ?? this.config.topP,
      stop_sequences: options.stopSequences ?? this.config.stopSequences,
      tools: options.tools?.map((t) => this.convertTool(t)),
    };
  }

  private convertMessages(messages: ChatMessage[]): unknown[] {
    return messages.map((m) => ({
      role: m.role === "tool" ? "assistant" : m.role,
      content: m.content,
    }));
  }

  private convertTool(tool: ToolDefinition): unknown {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    };
  }

  private parseResponse(data: {
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  }): LLMResponse {
    const content = data.content?.find((c) => c.type === "text")?.text || "";
    return {
      content,
      hasToolCalls: data.stop_reason === "tool_use",
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens || 0,
            outputTokens: data.usage.output_tokens || 0,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined,
      finishReason: data.stop_reason,
    };
  }
}
