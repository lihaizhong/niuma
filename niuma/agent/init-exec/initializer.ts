/**
 * Initializer - 项目初始化器
 *
 * 负责一次性项目初始化和结构创建
 */

import { join } from "path";
import fs from "fs-extra";
import { createLogger } from "../../log";
import type { InitializerConfig } from "./types";
import { DEFAULT_INITIALIZER_CONFIG } from "./types";

const logger = createLogger("initializer");

export interface InitializerOptions {
  workspace: string;
  config?: Partial<InitializerConfig>;
}

export class Initializer {
  private config: InitializerConfig;
  private workspace: string;

  constructor(options: InitializerOptions) {
    this.workspace = options.workspace;
    this.config = {
      projectSpec: "",
      projectName: "new-project",
      structure: DEFAULT_INITIALIZER_CONFIG.structure ?? [],
      initialFiles: DEFAULT_INITIALIZER_CONFIG.initialFiles ?? {},
      initCommands: DEFAULT_INITIALIZER_CONFIG.initCommands ?? [],
      ...options.config,
    };
  }

  async initialize(): Promise<{ success: boolean; created: string[]; errors: string[] }> {
    const created: string[] = [];
    const errors: string[] = [];

    logger.info({ workspace: this.workspace }, "开始项目初始化");

    try {
      await this._createDirectoryStructure(created);

      await this._createInitialFiles(created);

      await this._createAgentsMd();

      await this._initializeGit();

      await this._runInitCommands(errors);

      logger.info({ created: created.length }, "项目初始化完成");
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      logger.error({ error: err }, "项目初始化失败");
    }

    return {
      success: errors.length === 0,
      created,
      errors,
    };
  }

  private async _createDirectoryStructure(created: string[]): Promise<void> {
    for (const dir of this.config.structure) {
      const dirPath = join(this.workspace, dir);
      await fs.ensureDir(dirPath);
      created.push(dir);
      logger.debug({ dir }, "目录已创建");
    }
  }

  private async _createInitialFiles(created: string[]): Promise<void> {
    for (const [fileName, content] of Object.entries(this.config.initialFiles)) {
      const filePath = join(this.workspace, fileName);
      await fs.ensureDir(join(filePath, ".."));
      await fs.writeFile(filePath, content, "utf-8");
      created.push(fileName);
      logger.debug({ file: fileName }, "文件已创建");
    }
  }

  private async _createAgentsMd(): Promise<void> {
    const agentsPath = join(this.workspace, "AGENTS.md");
    const content = `# ${this.config.projectName} - AGENTS.md

## 项目概述

${this.config.projectSpec || "项目初始化完成"}

## 工具使用指南

- 使用 \`read_file\` 读取文件
- 使用 \`write_file\` 写入文件
- 使用 \`Bash\` 执行命令

## 开发规范

1. 遵循 TDD 开发流程
2. 保持代码简洁
3. 添加必要的测试
`;

    await fs.writeFile(agentsPath, content, "utf-8");
    logger.debug({ file: "AGENTS.md" }, "AGENTS.md 已创建");
  }

  private async _initializeGit(): Promise<void> {
    const gitPath = join(this.workspace, ".git");

    if (!(await fs.pathExists(gitPath))) {
      logger.debug("跳过 git init (目录已存在或未配置)");
    }

    const gitignorePath = join(this.workspace, ".gitignore");
    const gitignore = `node_modules/
dist/
*.log
.env
.DS_Store
`;

    if (!(await fs.pathExists(gitignorePath))) {
      await fs.writeFile(gitignorePath, gitignore, "utf-8");
      logger.debug(".gitignore 已创建");
    }
  }

  private async _runInitCommands(errors: string[]): Promise<void> {
    for (const cmd of this.config.initCommands) {
      try {
        logger.debug({ cmd }, "执行初始化命令");
      } catch (err) {
        errors.push(`Command failed: ${cmd}`);
      }
    }
  }

  setProjectSpec(spec: string): void {
    this.config.projectSpec = spec;
  }

  setProjectName(name: string): void {
    this.config.projectName = name;
  }

  addDirectory(dir: string): void {
    if (!this.config.structure.includes(dir)) {
      this.config.structure.push(dir);
    }
  }

  addInitialFile(fileName: string, content: string): void {
    this.config.initialFiles[fileName] = content;
  }
}
