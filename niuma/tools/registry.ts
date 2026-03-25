import type { ToolSpec, ToolContext } from "./types";

export class ToolRegistry {
  private tools = new Map<string, ToolSpec<unknown>>();

  register<T>(spec: ToolSpec<T>): this {
    this.tools.set(spec.name, spec as ToolSpec<unknown>);
    return this;
  }

  async execute(name: string, args: unknown, context?: ToolContext): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }
    return tool.execute(args, context);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }
}
