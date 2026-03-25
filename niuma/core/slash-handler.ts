export interface SlashCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<string>;
}

export interface SlashHandler {
  register(command: SlashCommand): void;
  execute(input: string): Promise<string | null>;
}

export function createSlashHandler(): SlashHandler {
  const commands = new Map<string, SlashCommand>();

  return {
    register(command: SlashCommand): void {
      commands.set(command.name, command);
    },

    async execute(input: string): Promise<string | null> {
      if (!input.startsWith("/")) {
        return null;
      }

      const parts = input.slice(1).split(" ");
      const name = parts[0];
      const args = parts.slice(1);

      const command = commands.get(name);
      if (!command) {
        return null;
      }

      return command.handler(args);
    },
  };
}
