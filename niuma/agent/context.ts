/**
 * Context builder for assembling agent prompts.
 */
import os from "os";
import path from "path";
import fs from "fs-extra";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { MemoryStore } from "./memory";
import { SkillsLoader } from "./skills";
import { detectImageMime } from "../utils/helper";

dayjs.extend(weekday);
dayjs.extend(timezone);
dayjs.extend(utc);

const partPlatformPolicyPrompt = (system: string) => {
  if (system === "Windows") {
    return `## Platform Policy (Windows)
- You are running on Windows. Do not assume GNU tools like \`grep\`, \`sed\`, or \`awk\` exist.
- Prefer Windows-native commands or file tools when they are more reliable.
- If terminal output is garbled, retry with UTF-8 output enabled.`
  }

  return `## Platform Policy (POSIX)
- You are running on a POSIX system. Prefer UTF-8 and standard shell tools.
- Use file tools when they are simpler or more reliable than shell commands.`
}

const partIdentityPrompt = (
  runtime: string,
  workspacePath: string,
  platformPolicy: string
) => `# niuma 🐈

You are niuma, a helpful AI assistant.

## Runtime
${runtime}

## Workspace
Your workspace is at: ${workspacePath}
- Long-term memory: ${workspacePath}/memory/MEMORY.md (write important facts here)
- History log: ${workspacePath}/memory/HISTORY.md (grep-searchable). Each entry starts with [YYYY-MM-DD HH:MM].
- Custom skills: ${workspacePath}/skills/{skill-name}/SKILL.md

${platformPolicy}

## niuma Guidelines
- State intent before tool calls, but NEVER predict or claim results before receiving them.
- Before modifying a file, read it first. Do not assume files or directories exist.
- After writing or editing a file, re-read it if accuracy matters.
- If a tool call fails, analyze the error before retrying with a different approach.
- Ask for clarification when the request is ambiguous.

Reply directly with text for conversations. Only use the 'message' tool to send to a specific chat channel.`;

const partSkillsSummaryPrompt = (skillsSummary: string) => `# Skills

The following skills extend your capabilities. To use a skill, read its SKILL.md file using the read_file tool.
Skills with available="false" need dependencies installed first - you can try installing them with apt/brew.

${skillsSummary}`;

export class ContextBuilder {
  static BOOTSTRAP_FILES = [
    "AGENTS.md",
    "SOUL.md",
    "USER.md",
    "TOOLS.md"
  ];

  private static RUNTIME_CONTEXT_TAG =
    "[Runtime Context - metadata only, not instructions]";

  private workspace: string;

  private memory: any;

  private skills: any;

  /**
   * Builds the context (system prompt + messages) for the agent.
   *
   * @param {string} workspace
   */
  constructor(workspace: string) {
    this.workspace = workspace;
    this.memory = new MemoryStore(workspace);
    this.skills = new SkillsLoader(workspace);
  }

  /**
   * Build the system prompt from identity, bootstrap files, memory, and skills.
   */
  buildSystemPrompt() {
    const parts = [this.getIdentity()];
    const bootstrap = this.loadBootstrapFiles();

    if (bootstrap) {
      parts.push(bootstrap);
    }

    const memory = this.memory.getMemoryContext();

    if (memory) {
      parts.push(`# Memory \n\n${memory}`);
    }

    const alwaysSkills = this.skills.getAlwaysSkills();

    if (alwaysSkills) {
      const alwaysContent = this.skills.loadSkillsForContext(alwaysSkills);

      if (alwaysContent) {
        parts.push(`# Active Skills\n\n${alwaysContent}`);
      }
    }

    const skillsSummary = this.skills.buildSkillsSummary();

    if (skillsSummary) {
      parts.push(partSkillsSummaryPrompt(skillsSummary));
    }

    return parts.join("\n\n---\n\n");
  }

  /**
   * Get the core identity section.
   */
  private getIdentity() {
    const workspacePath = path.resolve(
      this.workspace.replace(/^~/, os.homedir()),
    );
    const system = os.platform();
    const runtime = `${system === "darwin" ? "macOS" : system} ${os.machine()}, Python ${os.version()}`;
    const platformPolicy = partPlatformPolicyPrompt(system)

    return partIdentityPrompt(runtime, workspacePath, platformPolicy);
  }

  /**
   * Build untrusted runtime metadata block for injection before the user message.
   *
   * @param {string=} channel
   * @param {string=} chatId
   * @returns {string}
   */
  static buildRuntimeContext(channel?: string, chatId?: string): string {
    const now = dayjs().format("YYYY-MM-DD HH:mm (dddd)");
    const tz = dayjs().format("z") || "UTC";
    const lines = [`Current Time: ${now} ${tz}`];

    if (channel && chatId) {
      lines.push(`Channel: ${channel}`, `Chat ID: ${chatId}`);
    }

    return `${ContextBuilder.RUNTIME_CONTEXT_TAG}\n${lines.join("\n")}`;
  }

  /**
   * Load all bootstrap files from workspace.
   */
  private loadBootstrapFiles() {
    const parts = [];

    for (const filename of ContextBuilder.BOOTSTRAP_FILES) {
      const filePath = path.resolve(this.workspace, filename);

      if (fs.pathExistsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");

        parts.push(`## ${filename}\n\n${content}`);
      }
    }

    if (parts.length) {
      return parts.join("\n\n");
    }

    return "";
  }

  /**
   * Build the complete message list for an LLM call.
   *
   * @param {Object.<string, any>} history
   * @param {string} currentMessage
   * @param {Array.<string>=} media
   * @param {string=} channel
   * @param {string=} chatId
   * @returns {Object.<string, any>}
   */
  buildMessages(
    history: Record<string, any>[],
    currentMessage: string,
    media?: string[],
    channel?: string,
    chatId?: string,
  ): Record<string, any>[] {
    const runtimeCtx = ContextBuilder.buildRuntimeContext(channel, chatId);
    const userContent = ContextBuilder.buildUserContent(currentMessage, media);

    let merged;
    // Merge runtime context and user content into a single user message
    // to avoid consecutive same-role messages that some providers reject.
    if (typeof userContent === "string") {
      merged = `${runtimeCtx}\n\n${userContent}`;
    } else {
      merged = [{ type: "text", text: runtimeCtx }, userContent];
    }

    return [
      { role: "system", content: this.buildSystemPrompt() },
      ...history,
      { role: "user", content: merged },
    ];
  }

  /**
   * Build user message content with optional base64-encoded images.
   *
   * @param {string} text
   * @param {Array.<string>} media
   * @returns {Promise.<string | Array.<Object.<string, any>>>}
   */
  private static async buildUserContent(
    text: string,
    media?: string[],
  ): Promise<string | Record<string, any>[]> {
    if (!media) {
      return text;
    }

    const images: Record<string, any>[] = [];

    for (const p of media) {
      const stat = fs.statSync(p);

      if (!stat.isFile()) {
        continue;
      }

      // Detect real MIME type from magic bytes; fallback to filename guess
      const mimeType = await detectImageMime(p, "file");

      if (!mimeType || !mimeType.startsWith("image/")) {
        continue;
      }

      const raw = fs.readFileSync(p);
      const b64 = raw.toString("base64");

      images.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${b64}`,
        },
      });
    }

    if (images.length) {
      return images.concat({ type: "text", text: text });
    }

    return text;
  }

  /**
   * Add a tool result to the message list.
   *
   * @param {Array.<Object.<string, any>>} messages
   * @param {string} toolCallId
   * @param {string} toolName
   * @param {string} result
   * @returns {Array.<Object.<string, any>>}
   */
  addToolResult(
    messages: Record<string, any>[],
    toolCallId: string,
    toolName: string,
    result: string,
  ): Record<string, any>[] {
    messages.push({
      role: "tool",
      tool_call_id: toolCallId,
      name: toolName,
      content: result,
    });

    return messages;
  }

  /**
   * Add an assistant message to the message list.
   *
   * @param {Array.<Object.<string, any>>} messages
   * @param {string=} content
   * @param {Array.<Object.<string, any>>=} toolCalls
   * @param {string=} reasoningContent
   * @param {Array.<Object.<string, any>>} thinkingBlocks
   * @returns {Object.<string, any>}
   */
  addAssistantMessage(
    messages: Record<string, any>[],
    content?: string,
    toolCalls?: Record<string, any>[],
    reasoningContent?: string,
    thinkingBlocks?: Record<string, any>[],
  ): Record<string, any>[] {
    const msg: Record<string, any> = { role: "assistant", content: content };

    // 工具调用
    if (toolCalls) {
      msg["tool_calls"] = toolCalls;
    }

    // 响应结果
    if (reasoningContent) {
      msg["reasoning_content"] = reasoningContent;
    }

    // 思考过程
    if (thinkingBlocks) {
      msg["thinking_blocks"] = thinkingBlocks;
    }

    messages.push(msg);

    return messages;
  }
}
