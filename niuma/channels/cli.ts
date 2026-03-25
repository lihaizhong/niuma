import { BaseChannel } from "./base";

export class CLIChannel extends BaseChannel {
  name = "cli";

  async send(message: string): Promise<void> {
    console.log(message);
  }

  protected async doStart(): Promise<void> {
    process.stdin.on("data", (data) => {
      const message = data.toString().trim();
      if (message) {
        this.receive(message);
      }
    });
  }

  protected async doStop(): Promise<void> {
    process.stdin.removeAllListeners("data");
  }
}
