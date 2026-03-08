import { Tool } from "./base";

export class CronTool extends Tool {
  private cron: any;

  private channel: string;

  private chatId: string;

  private inCronContext: any;

  get name(): string {
    return "cron"
  }

  get description(): string {
    return "Schedule reminders and recurring tasks. Actions: add, list, remove."
  }

  get parameters(): Record<string, any> {
    return {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["add", "list", "remove"],
          description: "Action to perform"
        },
        message: {
          type: "string",
          description: "Reminder message (for add)"
        },
        every_seconds: {
          type: "integer",
          description: "Interval in seconds (for recurring tasks)"
        },
        cron_expr: {
          type: "string",
          description: "Cron expression like '0 9 * * *' (for scheduled tasks)"
        },
        tz: {
          type: "string",
          description: "IANA timezone for cron expressions (e.g. 'America/Vancouver')"
        },
        at: {
          type: "string",
          description: "ISO datetime for one-time execution (e.g. '2026-02-12T10:30:00')"
        },
        job_id: {
          type: "string",
          description: "Job ID (for remove)"
        }
      },
      required: ["action"]
    }
  }

  /**
   * Tool to schedule reminders and recurring tasks.
   *
   * @param {CronService} cronService
   */
  constructor(cronService: any) {
    this.cron = cronService;
    this.channel = "";
    this.chatId = "";
    this.inCronContext = new ContextVar("cron_in_context", false);
  }

  /**
   * Set the current session context for delivery.
   *
   * @param {string} channel
   * @param {string} chatId
   */
  setContext(channel: string, chatId: string): void {
    this.channel = channel;
    this.chatId = chatId;
  }

  /**
   * Mark whether the tool is executing inside a cron job callback.
   *
   * @param {boolean} active
   * @returns
   */
  setCronContext(active: boolean): void {
    return this.inCronContext.set(active);
  }

  /**
   * Restore previous cron context.
   *
   * @param {string} token
   */
  resetCronContext(token: string): void {
    this.inCronContext.reset(token);
  }
}
