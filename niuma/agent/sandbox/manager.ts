/**
 * 沙箱管理器 - 核心管理类
 *
 * 管理 Docker 容器生命周期，提供沙箱执行能力
 *
 * @see 参考 Claude Code Harness 设计
 */

import Docker from "dockerode";
import { nanoid } from "nanoid";

import { createLogger } from "../../log";

import { SandboxContainer } from "./container";
import { ToolInterceptor } from "./interceptor";
import {
  DEFAULT_RESOURCE_LIMITS,
  DEFAULT_SANDBOX_CONFIG,
} from "./types";

import type {
  ContainerInfo,
  ExecutionOptions,
  ExecutionResult,
  ResourceLimits,
  SandboxConfig,
} from "./types";
import type { ToolCall } from "../../types/tool";

const logger = createLogger("sandbox-manager");

export interface SandboxManagerOptions {
  config?: Partial<SandboxConfig>;
  limits?: Partial<ResourceLimits>;
  poolSize?: number;
  dockerSocket?: string;
}

export class SandboxManager {
  private docker: Docker;
  private config: SandboxConfig;
  private limits: ResourceLimits;
  private poolSize: number;
  private pool: SandboxContainer[] = [];
  private activeContainers: Map<string, SandboxContainer> = new Map();
  private workspace: string;
  private interceptor: ToolInterceptor;
  private initialized = false;

  constructor(workspace: string, options: SandboxManagerOptions = {}) {
    this.workspace = workspace;

    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...options.config };
    this.limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.limits };
    this.poolSize = options.poolSize ?? 2;

    const dockerOptions: Docker.DockerOptions = {};
    if (options.dockerSocket) {
      dockerOptions.socketPath = options.dockerSocket;
    } else {
      dockerOptions.socketPath = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
    }

    this.docker = new Docker(dockerOptions);

    this.interceptor = new ToolInterceptor({
      enabled: true,
      interceptedTools: ["exec"],
      fallbackToDirect: true,
    });
    this.interceptor.setSandboxManager(this);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn("沙箱管理器已初始化，跳过");
      return;
    }

    try {
      await this._checkDockerConnection();
      await this._ensureImage();
      await this._initPool();

      this.initialized = true;
      logger.info(
        {
          image: this.config.image,
          poolSize: this.poolSize,
          networkIsolation: this.config.networkIsolation,
        },
        "沙箱管理器初始化完成"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "沙箱管理器初始化失败");
      throw error;
    }
  }

  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const container = await this._acquireContainer();
    try {
      return await container.exec(options);
    } finally {
      this._releaseContainer(container);
    }
  }

  async executeToolCall(toolCall: ToolCall): Promise<ExecutionResult> {
    const args = toolCall.arguments as Record<string, unknown>;

    const command = (args.command as string) || (args.cmd as string) || "";
    const cmdArgs = (args.args as string[]) || [];
    const cwd = args.cwd as string | undefined;
    const env = args.env as Record<string, string> | undefined;
    const timeout = args.timeout as number | undefined;

    return this.execute({
      command,
      args: cmdArgs,
      cwd,
      env,
      timeout,
    });
  }

  async createContainer(
    customConfig?: Partial<SandboxConfig>
  ): Promise<ContainerInfo> {
    const config = { ...this.config, ...customConfig };
    const containerName = `niuma-sandbox-${nanoid(8)}`;
    const container = new SandboxContainer(this.docker, config, this.limits, containerName);

    await container.create();
    await container.start();

    const id = await container.create();
    this.activeContainers.set(id, container);

    const info = await container.getInfo();
    if (!info) {
      throw new Error("无法获取容器信息");
    }

    return info;
  }

  async removeContainer(containerId: string): Promise<void> {
    const container = this.activeContainers.get(containerId);
    if (container) {
      await container.remove();
      this.activeContainers.delete(containerId);
    }
  }

  async listContainers(): Promise<ContainerInfo[]> {
    const infos: ContainerInfo[] = [];

    for (const container of this.activeContainers.values()) {
      const info = await container.getInfo();
      if (info) {
        infos.push(info);
      }
    }

    return infos;
  }

  async shutdown(): Promise<void> {
    logger.info("开始关闭沙箱管理器");

    for (const container of this.pool) {
      await container.stop();
      await container.remove();
    }
    this.pool = [];

    for (const container of this.activeContainers.values()) {
      await container.stop();
      await container.remove();
    }
    this.activeContainers.clear();

    this.initialized = false;
    logger.info("沙箱管理器已关闭");
  }

  getInterceptor(): ToolInterceptor {
    return this.interceptor;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.docker.ping();
      return { healthy: true, message: "Docker 连接正常" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { healthy: false, message: `Docker 连接失败: ${message}` };
    }
  }

  private async _checkDockerConnection(): Promise<void> {
    try {
      await this.docker.ping();
      logger.debug("Docker 连接检查通过");
    } catch (error) {
      throw new Error(
        "无法连接到 Docker。请确保 Docker 正在运行。"
      , { cause: error });
    }
  }

  private async _ensureImage(): Promise<void> {
    try {
      await this.docker.listImages({
        filters: { reference: [this.config.image] },
      });
      logger.debug({ image: this.config.image }, "镜像已存在");
    } catch {
      logger.info({ image: this.config.image }, "正在拉取镜像...");

      await this._pullImage(this.config.image);

      logger.info({ image: this.config.image }, "镜像拉取完成");
    }
  }

  private async _initPool(): Promise<void> {
    for (let i = 0; i < this.poolSize; i++) {
      const containerName = `niuma-pool-${nanoid(8)}`;
      const container = new SandboxContainer(
        this.docker,
        this.config,
        this.limits,
        containerName
      );

      try {
        await container.create();
        await container.start();
        this.pool.push(container);
        logger.debug({ name: containerName }, "池容器创建成功");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn({ name: containerName, error: message }, "池容器创建失败");
      }
    }

    logger.info({ poolSize: this.pool.length }, "容器池初始化完成");
  }

  private async _acquireContainer(): Promise<SandboxContainer> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    const containerName = `niuma-exec-${nanoid(8)}`;
    const container = new SandboxContainer(
      this.docker,
      this.config,
      this.limits,
      containerName
    );

    await container.create();
    await container.start();

    return container;
  }

  private _releaseContainer(container: SandboxContainer): void {
    if (this.pool.length < this.poolSize) {
      this.pool.push(container);
    } else {
      container.remove().catch(() => {});
    }
  }

  private async _pullImage(image: string): Promise<void> {
    const stream = await this.docker.pull(image);
    await new Promise<void>((resolve, reject) => {
      this.docker.modem.followProgress(
        stream,
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
