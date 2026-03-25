/**
 * Docker 容器封装
 *
 * 管理单个沙箱容器的生命周期
 */


import { createLogger } from "../../log";

import type {
  ContainerInfo,
  ExecutionOptions,
  ExecutionResult,
  ResourceLimits,
  SandboxConfig,
} from "./types";
import type Docker from "dockerode";

const logger = createLogger("sandbox-container");

export class SandboxContainer {
  private docker: Docker;
  private container: Docker.Container | null = null;
  private config: SandboxConfig;
  private limits: ResourceLimits;
  private containerName: string;

  constructor(
    docker: Docker,
    config: SandboxConfig,
    limits: ResourceLimits,
    containerName: string
  ) {
    this.docker = docker;
    this.config = config;
    this.limits = limits;
    this.containerName = containerName;
  }

  async create(): Promise<string> {
    const hostConfig: Docker.HostConfig = {
      Memory: this._parseMemory(this.limits.memoryLimit),
      NanoCpus: Math.floor(this.limits.cpuLimit * 1e9),
      NetworkMode: this.config.networkIsolation ? "none" : "bridge",
      AutoRemove: true,
    };

    const exposedPorts: Record<string, object> = {};
    const portBindings: Record<string, Docker.PortBinding[]> = {};

    const createOptions: Docker.ContainerCreateOptions = {
      name: this.containerName,
      Image: this.config.image,
      Env: this._buildEnv(),
      ExposedPorts: exposedPorts,
      HostConfig: hostConfig,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Cmd: ["sleep", "infinity"],
    };

    try {
      const result = await this.docker.createContainer(createOptions);
      this.container = result;
      logger.info({ containerId: result.id, name: this.containerName }, "容器创建成功");
      return result.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        await this._cleanupExisting();
        return this.create();
      }
      logger.error({ error: message }, "容器创建失败");
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.container) {
      throw new Error("容器未创建");
    }

    try {
      await this.container.start();
      logger.info({ containerId: this.container.id }, "容器启动成功");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("already started")) {
        logger.error({ error: message }, "容器启动失败");
        throw error;
      }
    }
  }

  async exec(options: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.container) {
      throw new Error("容器未创建");
    }

    const startTime = Date.now();
    const timeout = options.timeout ?? this.limits.timeout;

    const execOptions: Docker.ExecCreateOptions = {
      AttachStdout: true,
      AttachStderr: true,
      Cmd: options.args ? [options.command, ...options.args] : [options.command],
      WorkingDir: options.cwd || "/workspace",
      Env: options.env ? this._buildEnv(options.env) : undefined,
    };

    try {
      const exec = await this.container.exec(execOptions);

      const stream = await exec.start({
        hijack: true,
        stdin: false,
      });

      const output = await this._collectOutput(stream, timeout);
      const inspect = await exec.inspect();

      const duration = Date.now() - startTime;

      return {
        stdout: output.stdout,
        stderr: output.stderr,
        exitCode: inspect.ExitCode ?? 0,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;

      if (message.includes("timeout") || message.includes("Timed out")) {
        return {
          stdout: "",
          stderr: `命令执行超时 (${timeout}ms)`,
          exitCode: 124,
          duration,
        };
      }

      return {
        stdout: "",
        stderr: `执行错误: ${message}`,
        exitCode: 1,
        duration,
      };
    }
  }

  async stop(): Promise<void> {
    if (!this.container) {
      return;
    }

    try {
      await this.container.stop({ t: 5 });
      logger.info({ containerId: this.container.id }, "容器停止成功");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("not running")) {
        logger.warn({ error: message }, "容器停止失败");
      }
    }
  }

  async remove(): Promise<void> {
    if (!this.container) {
      return;
    }

    try {
      await this.container.remove({ force: true, v: true });
      logger.info({ containerId: this.container.id }, "容器移除成功");
      this.container = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn({ error: message }, "容器移除失败");
    }
  }

  async getInfo(): Promise<ContainerInfo | null> {
    if (!this.container) {
      return null;
    }

    try {
      const info = await this.container.inspect();
      return {
        id: info.Id,
        name: info.Name.replace("/", ""),
        image: info.Config.Image,
        status: info.State.Running ? "running" : "stopped",
        createdAt: new Date(info.Created),
      };
    } catch {
      return null;
    }
  }

  isRunning(): boolean {
    return this.container !== null;
  }

  private async _cleanupExisting(): Promise<void> {
    try {
      const existing = this.docker.getContainer(this.containerName);
      await existing.remove({ force: true });
      logger.info({ name: this.containerName }, "已清理同名容器");
    } catch {
      // 容器不存在，忽略
    }
  }

  private _parseMemory(memory: string): number {
    const match = memory.match(/^(\d+)([kmg]?)$/i);
    if (!match) {
      return 512 * 1024 * 1024;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "k":
        return value * 1024;
      case "m":
        return value * 1024 * 1024;
      case "g":
        return value * 1024 * 1024 * 1024;
      default:
        return value;
    }
  }

  private _buildEnv(customEnv?: Record<string, string>): string[] {
    const env: string[] = [
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "LANG=C.UTF-8",
      "LC_ALL=C.UTF-8",
    ];

    if (customEnv) {
      for (const [key, value] of Object.entries(customEnv)) {
        env.push(`${key}=${value}`);
      }
    }

    return env;
  }

  private async _collectOutput(
    stream: NodeJS.ReadableStream,
    timeout: number
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error("执行超时"));
      }, timeout);

      stream.on("data", (chunk: Buffer) => {
        if (timedOut) return;

        const data = chunk.toString("utf-8");
        const lines = data.split("\n");

        for (const line of lines) {
          if (line.startsWith("\x02")) {
            stdout += line.substring(1) + "\n";
          } else if (line.startsWith("\x03")) {
            stderr += line.substring(1) + "\n";
          } else {
            stdout += line + "\n";
          }
        }
      });

      stream.on("end", () => {
        clearTimeout(timeoutId);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      stream.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }
}
