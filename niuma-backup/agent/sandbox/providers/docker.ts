/**
 * Docker Sandbox Provider
 * 
 * 基于 Docker Socket 的沙箱实现
 */

import Docker from "dockerode";
import { nanoid } from "nanoid";

import { createLogger } from "../../../log";
import { SandboxContainer } from "../container";

import {
  DEFAULT_RESOURCE_LIMITS,
} from "./types";

import type { SandboxProvider } from "./base";
import type {
  ExecutionOptions,
  ExecutionResult,
  SandboxConfig,
} from "./types";


const logger = createLogger("sandbox-docker");

export class DockerSandboxProvider implements SandboxProvider {
  readonly name = "docker";
  
  private docker: Docker;
  private config: SandboxConfig;
  private pool: SandboxContainer[] = [];
  private poolSize: number;
  private initialized = false;

  static create(config?: Partial<SandboxConfig> & { dockerSocket?: string; poolSize?: number }): DockerSandboxProvider | null {
    try {
      return new DockerSandboxProvider(config);
    } catch {
      return null;
    }
  }

  private constructor(config?: Partial<SandboxConfig> & { dockerSocket?: string; poolSize?: number }) {
    const dockerOptions: Docker.DockerOptions = {};
    const socketPath = config?.dockerSocket || process.env.DOCKER_SOCKET || "/var/run/docker.sock";
    dockerOptions.socketPath = socketPath;

    this.docker = new Docker(dockerOptions);
    this.config = {
      image: config?.image || "ubuntu:22.04",
      networkIsolation: config?.networkIsolation ?? true,
      timeout: config?.timeout || 60000,
    } as SandboxConfig;
    this.poolSize = config?.poolSize || 2;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this._ensureImage();
    await this._initPool();
    this.initialized = true;
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

  async shutdown(): Promise<void> {
    for (const container of this.pool) {
      await container.stop();
      await container.remove();
    }
    this.pool = [];

    this.initialized = false;
    logger.info("DockerSandboxProvider 已关闭");
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
        DEFAULT_RESOURCE_LIMITS,
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
      DEFAULT_RESOURCE_LIMITS,
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
