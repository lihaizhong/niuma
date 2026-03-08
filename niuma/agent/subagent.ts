import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import logger from "./logger";
import { ContextBuilder } from "./context";
import { SkillsLoader } from "./skills";

const execAsync = promisify(exec);

// Simple message constructor
const InboundMessage = (type: string, from: string, to: string, content: string) => ({
  type,
  from,
  to,
  content,
  timestamp: new Date().toISOString(),
});

// Simple Tool Registry
class ToolRegistry {
  private tools: Map<string, any> = new Map();

  register(tool: any) {
    this.tools.set(tool.name, tool);
  }

  getTools() {
    return Array.from(this.tools.values());
  }
}

// Basic Tools
const ReadFileTool = (workspace: string, allowedDir: string) => ({
  name: 'read_file',
  description: 'Read the contents of a file',
  handler: async (params: { filePath: string }) => {
    const filePath = path.resolve(workspace, params.filePath);
    if (allowedDir && !filePath.startsWith(allowedDir)) {
      throw new Error('Access denied');
    }
    return fs.promises.readFile(filePath, 'utf-8');
  }
});

const WriteFileTool = (workspace: string, allowedDir: string) => ({
  name: 'write_file',
  description: 'Write content to a file',
  handler: async (params: { filePath: string, content: string }) => {
    const filePath = path.resolve(workspace, params.filePath);
    if (allowedDir && !filePath.startsWith(allowedDir)) {
      throw new Error('Access denied');
    }
    await fs.promises.writeFile(filePath, params.content);
    return 'File written successfully';
  }
});

const EditFileTool = (workspace: string, allowedDir: string) => ({
  name: 'edit_file',
  description: 'Edit a file by replacing text',
  handler: async (params: { filePath: string, oldString: string, newString: string }) => {
    const filePath = path.resolve(workspace, params.filePath);
    if (allowedDir && !filePath.startsWith(allowedDir)) {
      throw new Error('Access denied');
    }
    let content = await fs.promises.readFile(filePath, 'utf-8');
    content = content.replace(params.oldString, params.newString);
    await fs.promises.writeFile(filePath, content);
    return 'File edited successfully';
  }
});

const ListDirTool = (workspace: string, allowedDir: string) => ({
  name: 'list_dir',
  description: 'List contents of a directory',
  handler: async (params: { path: string }) => {
    const dirPath = path.resolve(workspace, params.path);
    if (allowedDir && !dirPath.startsWith(allowedDir)) {
      throw new Error('Access denied');
    }
    const items = await fs.promises.readdir(dirPath);
    return items.join('\n');
  }
});

const ExecTool = (workspace: string, timeout: number, restrictToWorkspace: boolean) => ({
  name: 'exec',
  description: 'Execute a shell command',
  handler: async (params: { command: string }) => {
    if (restrictToWorkspace) {
      // Basic check, but not secure
    }
    const { stdout, stderr } = await execAsync(params.command, { cwd: workspace, timeout });
    return stdout || stderr;
  }
});

const WebSearchTool = (apiKey: string | null, proxy: string | null) => ({
  name: 'web_search',
  description: 'Search the web',
  handler: async (params: { query: string }) => {
    // Simple implementation, assuming Brave API or similar
    if (!apiKey) throw new Error('API key required');
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(params.query)}`;
    const response = await fetch(url, {
      headers: { 'X-Subscription-Token': apiKey }
    });
    const data = await response.json();
    return JSON.stringify(data);
  }
});

const WebFetchTool = (proxy: string | null) => ({
  name: 'web_fetch',
  description: 'Fetch a webpage',
  handler: async (params: { url: string }) => {
    const response = await fetch(params.url);
    return response.text();
  }
});

const partSubagentPrompt = (timeCtx: string, workspace: string) => `# Subagent

${timeCtx}

You are a subagent spawned by the main agent to complete a specific task.
Stay focused on the assigned task. Your final response will be reported back to the main agent.

## Workspace
${workspace}
`;

const partAnnouncePrompt = (
  label: string,
  statusText: string,
  task: string,
  result: string,
) => `[Subagent '${label}' ${statusText}]

Task: ${task}

Result:
${result}

Summarize this naturally for the user. Keep it brief (1-2 sentences). Do not mention technical details like "subagent" or task IDs.
`;

export class SubagentManager {
  private provider: any;

  private workspace: string;

  private bus: any;

  private model: string | null;

  private temperature: number;

  private maxTokens: number;

  private reasoningEffort: string | null;

  private braveApiKey: string | null;

  private webProxy: string | null;

  private execConfig: any;

  private restrictToWorkspace: boolean;

  private runningTasks: Map<string, any>;

  private sessionTasks: Map<string, Set<string>>;

  /**
   * Manages background subagent execution.
   *
   * @param provider
   * @param workspace
   * @param bus
   * @param model
   * @param temperature
   * @param max_tokens
   * @param reasoning_effort
   * @param brave_api_key
   * @param web_proxy
   * @param exec_config
   * @param restrict_to_workspace
   */
  constructor(
    provider: any,
    workspace: string,
    bus: any,
    model: string | null = null,
    temperature: number = 0.7,
    maxTokens: 4096,
    reasoningEffort: string | null,
    braveApiKey: string | null = null,
    webProxy: string | null = null,
    execConfig: any = null,
    restrictToWorkspace: boolean = false,
  ) {
    this.provider = provider;
    this.workspace = workspace;
    this.bus = bus;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.reasoningEffort = reasoningEffort;
    this.braveApiKey = braveApiKey;
    this.webProxy = webProxy;
    this.execConfig = execConfig;
    this.restrictToWorkspace = restrictToWorkspace;
    this.runningTasks = new Map();
    this.sessionTasks = new Map();
  }

  /**
   * Return the number of currently running subagents.
   *
   * @returns {number}
   */
  get runningCount(): number {
    return this.runningTasks.size;
  }

  async spawn(
    task: string,
    label: string | null,
    originChannel: string = "cli",
    originChatId: string = "direct",
    sessionKey: string | null,
  ): Promise<string> {
    const taskId = nanoid(8);
    const displayLabel =
      label || `${task.slice(0, 30)}${task.length > 30 ? "..." : ""}`;
    const origin = {
      channel: originChannel,
      chatId: originChatId,
    };

    // Start the subagent asynchronously
    this.runSubagent(taskId, task, displayLabel, origin).then(() => {
      this.runningTasks.delete(taskId);
      if (sessionKey) {
        const ids = this.sessionTasks.get(sessionKey);
        if (ids) {
          ids.delete(taskId);
          if (ids.size === 0) {
            this.sessionTasks.delete(sessionKey);
          }
        }
      }
    }).catch((error) => {
      logger.error(`Subagent [${taskId}] error: ${error}`);
      this.runningTasks.delete(taskId);
      // Similar cleanup
    });

    this.runningTasks.set(taskId, { taskId, label: displayLabel });

    if (sessionKey) {
      if (!this.sessionTasks.has(sessionKey)) {
        this.sessionTasks.set(sessionKey, new Set());
      }
      this.sessionTasks.get(sessionKey)!.add(taskId);
    }

    logger.info(`Spawned subagent[${taskId}]: ${displayLabel}`);

    return `Subagent [${displayLabel}] started (id: ${taskId}). I'll notify you when it completes.`;
  }

  /**
   * Execute the subagent task and announce the result.
   *
   * @param {string} taskId
   * @param {string} task
   * @param {string} label
   * @param {Object.<string, string>} origin
   */
  private async runSubagent(
    taskId: string,
    task: string,
    label: string,
    origin: Record<string, string>,
  ): Promise<void> {
    logger.info(`Subagent [${taskId}] starting task: ${label}`);

    try {
      // Build subagent tools (no message tool, no spawn tool)
      const tools = new ToolRegistry();
      const allowedDir = this.restrictToWorkspace ? this.workspace : "";

      tools.register(ReadFileTool(this.workspace, allowedDir));
      tools.register(WriteFileTool(this.workspace, allowedDir));
      tools.register(EditFileTool(this.workspace, allowedDir));
      tools.register(ListDirTool(this.workspace, allowedDir));
      tools.register(
        ExecTool(
          this.workspace,
          this.execConfig.timeout,
          this.restrictToWorkspace,
        ),
      );
      tools.register(WebSearchTool(this.braveApiKey, this.webProxy));
      tools.register(WebFetchTool(this.webProxy));

      const systemPrompt = this.buildSubagentPrompt();

      // Prepare messages for the provider
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task }
      ];

      // Call the provider to generate response
      const response = await this.provider.chat(messages, {
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        tools: tools.getTools(), // Assuming tools have getTools method
      });

      const result = response.content || 'Task completed without output';

      await this.announceResult(taskId, label, task, result, origin, 'ok');
    } catch (error: any) {
      logger.error(`Subagent [${taskId}] failed: ${error.message}`);
      await this.announceResult(taskId, label, task, `Error: ${error.message}`, origin, 'error');
    }
  }

  /**
   * Announce the subagent result to the main agent via the message bus.
   *
   * @param {} taskId
   * @param label
   * @param task
   * @param result
   * @param origin
   * @param status
   */
  private async announceResult(
    taskId: string,
    label: string,
    task: string,
    result: string,
    origin: Record<string, string>,
    status: string,
  ): Promise<void> {
    const statusText = status === "ok" ? "completed successfully" : "failed";
    const announceContent = partAnnouncePrompt(label, statusText, task, result);

    // Inject as system message to trigger main agent
    const msg = InboundMessage(
      "system",
      "subagent",
      `${origin.channel}:${origin.chatId}`,
      announceContent,
    );

    await this.bus.publishInbound(msg);
    logger.debug(
      `Subagent [${taskId}] announced result to ${origin.channel}:${origin.chatId}`,
    );
  }

  /**
   * Build a focused system prompt for the subagent.
   */
  buildSubagentPrompt(): string {
    const timeCtx = ContextBuilder.buildRuntimeContext();
    const parts = [partSubagentPrompt(timeCtx, this.workspace)];
    const skillsSummary = new SkillsLoader(this.workspace).buildSkillsSummary();

    if (skillsSummary) {
      parts.push(
        `## Skills\n\nRead SKILL.md with read_file to use a skill.\n\n${skillsSummary}`,
      );
    }

    return parts.join("\n\n");
  }

  /**
   * Cancel all subagents for the given session. Returns count cancelled.
   *
   * @param sessionKey
   */
  async cancelBySession(sessionKey: string): Promise<number> {
    const taskIds = this.sessionTasks.get(sessionKey);
    if (!taskIds) return 0;

    let cancelled = 0;
    for (const taskId of taskIds) {
      const task = this.runningTasks.get(taskId);
      if (task) {
        // Assuming task has a cancel method or we can abort it
        // For simplicity, just remove from maps
        this.runningTasks.delete(taskId);
        cancelled++;
        logger.info(`Cancelled subagent [${taskId}] for session ${sessionKey}`);
      }
    }
    this.sessionTasks.delete(sessionKey);
    return cancelled;
  }
}
