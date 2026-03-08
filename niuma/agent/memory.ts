import path from "path";
import fs from "fs-extra";
import logger from "./logger";

const SAVE_MEMORY_TOOL = [
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save the memory consolidation result to persistent storage.",
      parameters: {
        type: "object",
        properties: {
          history_entry: {
            type: "string",
            description: "A paragraph (2-5 sentences) summarizing key events/decisions/topics. Start with [YYYY-MM-DD HH:MM]. Include detail useful for grep search."
          },
          memory_update: {
            type: "string",
            description: "Full updated long-term memory as markdown. Include all existing facts plus new ones. Return unchanged if nothing new."
          }
        },
        required: ["history_entry", "memory_update"]
      }
    }
  }
]

const getConsolidationPrompt = (currentMemory: string, lines: string[]): string => `Process this conversation and call the save_memory tool with your consolidation.

## Current Long-term Memory
${currentMemory || "(empty)"}

## Conversation to Process
${lines.join("\n")}
`

export class MemoryStore {
  private memoryDir: string

  private memoryFile: string

  private historyFile: string

  /**
   * Two-layer memory: MEMORY.md (long-term facts) + HISTORY.md (grep-searchable log).
   * 
   * @param {string} workspace
   */
  constructor(workspace: string) {
    this.memoryDir = path.resolve(workspace, "memory");
    this.memoryFile = path.resolve(this.memoryDir, "MEMORY.md");
    this.historyFile = path.resolve(this.memoryDir, "HISTORY.md");
  }

  readLongTerm(): string {
    if (fs.pathExistsSync(this.memoryFile)) {
      return fs.readFileSync(this.memoryFile, "utf-8");
    }

    return "";
  }

  writeLongTerm(content: string): void {
    fs.writeFileSync(this.memoryFile, content, "utf-8");
  }

  appendHistory(entry: string): void {
    fs.appendFileSync(this.historyFile, `${entry.trimEnd()}\n\n`, "utf-8");
  }

  getMemoryContext(): string {
    const longTerm = this.readLongTerm();

    if (longTerm) {
      return `## Long-term Memory\n${longTerm}`;
    }

    return "";
  }

  /**
   * Consolidate old messages into MEMORY.md + HISTORY.md via LLM tool call.
   * 
   * Returns True on success (including no-op), False on failure.
   * 
   * @param {any} session 
   * @param {any} provider 
   * @param {string} model 
   * @param {boolean} archiveAll 
   * @param {number} memoryWindow 
   * @returns {Promise.<boolean>}
   */
  async consolidate(session: any, provider: any, model: string, archiveAll: boolean = false, memoryWindow: number = 50): Promise<boolean> {
    let oldMessages: any[] = [];
    let keepCount = 0;

    if (archiveAll) {
      oldMessages = session.messages;
      keepCount = 0;
      logger.info(`Memory consolidation (archive_all): ${session.messages.length} messages`)
    } else {
      keepCount = Math.floor(memoryWindow / 2); // Keep more recent messages for better context

      if (session.messages.length <= keepCount) {
        return true; // Not enough messages to consolidate, skip
      }

      if (session.messages.length - session.lastConsolidated <= 0) {
        return true; // No new messages since last consolidation, skip
      }

      oldMessages = session.messages.slice(session.lastConsolidated - keepCount)
      logger.info(`Memory consolidation: ${oldMessages.length} to consolidate, ${keepCount} keep`)
    }

    const lines = []

    for (const m of oldMessages) {
      if (!m.content) {
        continue;
      }

      const tools = ` [tools: ${m.tools_used ? `, ${m.tools_used}` : ""}]`;

      lines.push(`[${m.timestamp || "?"}] ${m.role.toUpperCase()}: ${tools}: ${m.content}`);
    }

    const currentMemory = this.readLongTerm();
    const prompt = getConsolidationPrompt(currentMemory, lines);

    try {
      const response = await provider.chat(
        [
          { "role": "system", "content": "You are a memory consolidation agent. Call the save_memory tool with your consolidation of the conversation." },
          { "role": "user", "content": prompt }
        ],
        SAVE_MEMORY_TOOL,
        model
      );

      if (!response.has_tool_calls) {
        logger.warn("Memory consolidation: LLM did not call save_memory, skipping")
        return false;
      }

      let args = response.tool_calls[0].arguments;

      if (typeof args === "string") {
        // Some providers return arguments as a JSON string instead of Object
        args = JSON.parse(args);
      } else if (args instanceof Array) {
        // Some providers return arguments as a Array (handle edge case)

        if (!(args[0] instanceof Object && args[0] !== null)) {
          logger.warn("Memory consolidation: unexpected arguments as empty or non-dict list")
          return false
        }

        args = args[0];
      } else if (!(args instanceof Object && args !== null)) {
        logger.warn(`Memory consolidation: unexpected arguments type ${typeof args}`)
        return false;
      }

      let entry = args.history_entry;

      if (entry) {
        if (typeof entry !== "string") {
          entry = JSON.stringify(entry);
        }

        this.appendHistory(entry);
      }

      let update = args.memory_update;

      if (update) {
        if (typeof update !== "string") {
          update = JSON.stringify(update);
        }

        if (update !== currentMemory) {
          this.writeLongTerm(update);
        }
      }

      session.lastConsolidated = archiveAll ? 0 : session.messages.length - keepCount; // Next consolidation starts from the last few messages we kept
      logger.info(`Memory consolidation done: ${session.messages.length}, last_consolidated=${session.lastConsolidated}`)
      return true;
    } catch (err) {
      logger.error("Memory consolidation error:", err);
      return false;
    }
  }
}
