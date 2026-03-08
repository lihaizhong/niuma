import { z } from "zod";

type ParamsType<T extends z.ZodTypeAny> = z.infer<T>;

/**
 * Abstract base class for agent tools
 * 
 * Tools are capabilities that the agent can use to interact with
 * the environment, such as reading files, executing commands, etc.
 */
export abstract class Tool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  /**
   * Tool name used in function calls.
   */
  abstract get name(): string;

  /**
   * Description of what the tool does.
   */
  abstract get description(): string;

  /**
   * JSON Schema for tool parameters.
   */
  abstract get parameters(): Record<string, any>;

  /**
   * Execute the tool with given parameters.
   * 
   * @param {Array.<any>} args
   * @returns {Promise.<string>}
   */
  abstract execute(...args: any): Promise<string>;

  /**
   * Apply safe schema-driven casts before validation.
   * 
   * @param {Object.<string, any>} params
   * @returns {Object.<string, any>}
   */
  castParams(params: Record<string, any> = {}): ParamsType<TSchema> {
    return z.fromJSONSchema(this.parameters).parse(params, this.parameters);
  }

  /**
   * Validate tool parameters against JSON schema. Returns error list (empty if valid).
   * 
   * @param {any} params 
   * @returns {Array.<string>}
   */
  validateParams(params: unknown): string[] {
    const result = this.parameters.safeParse(params);

    if (result.success) {
      return [];
    }

    return result.error.issues.map((issue) => {
      const path = issue.path.join(".");

      return path ? `${path}: ${issue.message}` : issue.message;
    })
  }

  /**
   * Convert tool to OpenAI function schema format.
   * 
   * @returns {Object.<string, any>}
   */
  toSchema(): {
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  } {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: z.toJSONSchema(this.parameters),
      }
    }
  }
}

