/**
 * LLM Service - 大模型服务
 * 提供与大模型交互的能力
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// API 响应类型定义
interface LLMAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private systemPrompt: string;
  private conversationHistory: ChatMessage[] = [];

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.systemPrompt = config.systemPrompt ?? this.getDefaultSystemPrompt();

    // 初始化对话历史，添加系统提示
    if (this.systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: this.systemPrompt,
      });
    }
  }

  /**
   * 获取默认系统提示
   */
  private getDefaultSystemPrompt(): string {
    return `你是牛马（Niuma），一个温暖、有亲和力的智能生活助手。

你的特点：
- 性格温暖、友善，像一个贴心的伙伴
- 回复简洁但有温度，避免冗长
- 适时给出建议和鼓励，提供情绪价值
- 懂得倾听，善于共情
- 用中文回复，语言自然亲切

你的能力：
- 帮助用户管理待办事项和目标
- 提供天气预报和生活建议
- 记住用户分享的重要信息
- 陪伴用户的日常生活

注意事项：
- 保持回复简短，通常 1-3 句话
- 用表情符号增加亲和力，但不要过度使用
- 遇到不确定的问题，诚实地说不知道`;
  }

  /**
   * 发送消息并获取回复
   */
  async chat(userMessage: string): Promise<LLMResponse> {
    // 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // 调用 LLM API
      const response = await this.callLLMAPI(this.conversationHistory);

      // 添加助手回复到历史
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      return response;
    } catch (error) {
      // 如果出错，移除用户消息
      this.conversationHistory.pop();
      throw error;
    }
  }

  /**
   * 调用 LLM API
   */
  private async callLLMAPI(messages: ChatMessage[]): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('未配置 API Key，请设置环境变量 IFLOW_API_KEY 或 LLM_API_KEY');
    }

    const requestBody = {
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
      max_tokens: 500,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as LLMAPIResponse;

    // 调试：打印响应结构
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('API 响应结构异常:', JSON.stringify(data, null, 2));
      throw new Error('API 响应格式异常，请检查模型名称或 API 配置');
    }

    return {
      content: data.choices[0]?.message?.content ?? '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  /**
   * 清除对话历史
   */
  clearHistory(): void {
    this.conversationHistory = this.systemPrompt 
      ? [{ role: 'system', content: this.systemPrompt }]
      : [];
  }

  /**
   * 获取对话历史
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * 设置系统提示
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    // 重新初始化对话历史
    this.conversationHistory = [{ role: 'system', content: prompt }];
  }

  /**
   * 检查是否已配置 API Key
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
