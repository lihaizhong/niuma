import type { Channel } from "./types";
import EventEmitter from "events";

export abstract class BaseChannel extends EventEmitter implements Channel {
  abstract name: string;
  status: "stopped" | "running" = "stopped";

  abstract send(message: string): Promise<void>;

  onMessage(handler: (message: string) => void): void {
    this.on("message", handler);
  }

  async start(): Promise<void> {
    if (this.status === "running") return;
    await this.doStart();
    this.status = "running";
  }

  async stop(): Promise<void> {
    if (this.status === "stopped") return;
    await this.doStop();
    this.status = "stopped";
  }

  protected abstract doStart(): Promise<void>;
  protected abstract doStop(): Promise<void>;

  protected receive(message: string): void {
    this.emit("message", message);
  }
}
