/**
 * 技能加载器 - 发现、加载和管理技能
 *
 * 实现技能发现、依赖检查、元数据解析等功能。
 * 支持工作区技能和内置技能，工作区技能优先。
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createLogger } from "../log";
import * as yaml from "js-yaml";

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger("skills");

/**
 * 技能信息
 */
export interface SkillInfo {
  /** 技能名称 */
  name: string;
  /** 技能文件路径 */
  path: string;
  /** 技能来源 */
  source: "workspace" | "builtin";
}

/**
 * 技能元数据
 */
export interface SkillMetadata {
  /** 技能名称 */
  name?: string;
  /** 技能描述 */
  description?: string;
  /** 依赖要求 */
  requires?: {
    /** CLI 工具依赖 */
    bins?: string[];
    /** 环境变量依赖 */
    env?: string[];
  };
  /** 其他元数据字段 */
  [key: string]: unknown;
}

/**
 * 技能完整信息（包含元数据和可用性）
 */
export interface SkillFullInfo extends SkillInfo {
  /** 元数据 */
  metadata: SkillMetadata;
  /** 是否可用（依赖满足） */
  available: boolean;
  /** 缺失的依赖 */
  missingDeps: {
    bins: string[];
    env: string[];
  };
}

/**
 * 技能加载器
 * @description 发现、加载和管理技能
 * 工作区技能位置：workspace/skills/
 * 内置技能位置：代码包中的 skills 目录
 */
export class SkillsLoader {
  /** 工作区根目录 */
  private readonly workspaceDir: string;
  /** 内置技能目录 */
  private readonly builtinSkillsDir: string;
  /** 技能缓存 */
  private skillsCache: Map<string, SkillFullInfo> | null = null;

  /**
   * 创建技能加载器实例
   * @param workspace 工作区根目录
   * @param builtinDir 内置技能目录（可选，默认为 niuma/skills）
   */
  constructor(workspace: string, builtinDir?: string) {
    this.workspaceDir = workspace;
    // 默认内置技能目录在 niuma/skills
    this.builtinSkillsDir = builtinDir ?? join(__dirname, "skills");
  }

  /**
   * 列出所有技能
   * @param filterUnavailable 是否过滤不可用的技能（依赖不满足）
   * @returns 技能信息列表
   */
  listSkills(filterUnavailable = false): SkillInfo[] {
    this._ensureCache();

    const skills = Array.from(this.skillsCache!.values());

    if (filterUnavailable) {
      return skills.filter((s) => s.available).map(this._toSkillInfo);
    }

    return skills.map(this._toSkillInfo);
  }

  /**
   * 加载技能内容（去除 frontmatter）
   * @param name 技能名称
   * @returns 技能内容，不存在则返回 null
   */
  loadSkill(name: string): string | null {
    this._ensureCache();

    const skill = this.skillsCache!.get(name);
    if (!skill) {
      return null;
    }

    try {
      const content = readFileSync(skill.path, "utf-8");
      return this._stripFrontmatter(content);
    } catch {
      return null;
    }
  }

  /**
   * 加载多个技能内容用于上下文注入
   * @param skillNames 技能名称列表
   * @returns 格式化的技能内容
   */
  loadSkillsForContext(skillNames: string[]): string {
    const parts: string[] = [];

    for (const name of skillNames) {
      const content = this.loadSkill(name);
      if (content) {
        parts.push(
          `--- SKILL: ${name} ---\n${content.trim()}\n--- END: ${name} ---`,
        );
      }
    }

    return parts.join("\n\n");
  }

  /**
   * 构建 XML 格式的技能摘要
   * @returns XML 格式的技能摘要
   */
  buildSkillsSummary(): string {
    this._ensureCache();

    const skills = Array.from(this.skillsCache!.values());

    if (skills.length === 0) {
      return "<skills>\n  (no skills available)\n</skills>";
    }

    const skillElements = skills
      .map((skill) => this._formatSkillXml(skill))
      .join("\n");

    return `<skills>\n${skillElements}\n</skills>`;
  }

  /**
   * 获取技能元数据
   * @param name 技能名称
   * @returns 元数据，不存在则返回 null
   */
  getSkillMetadata(name: string): SkillMetadata | null {
    this._ensureCache();

    const skill = this.skillsCache!.get(name);
    return skill?.metadata ?? null;
  }

  /**
   * 刷新技能缓存
   * @description 强制重新扫描技能目录
   */
  refresh(): void {
    this.skillsCache = null;
    this._ensureCache();
  }

  /**
   * 确保缓存已初始化
   */
  private _ensureCache(): void {
    if (this.skillsCache !== null) {
      return;
    }

    this.skillsCache = new Map();

    // 先加载内置技能
    this._loadSkillsFromDir(this.builtinSkillsDir, "builtin");

    // 再加载工作区技能（覆盖同名内置技能）
    const workspaceSkillsDir = join(this.workspaceDir, "skills");
    this._loadSkillsFromDir(workspaceSkillsDir, "workspace");
  }

  /**
   * 从目录加载技能
   * @param dir 技能目录
   * @param source 技能来源
   */
  private _loadSkillsFromDir(
    dir: string,
    source: "workspace" | "builtin",
  ): void {
    if (!existsSync(dir)) {
      return;
    }

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const skillPath = join(dir, entry.name, "SKILL.md");
        if (!existsSync(skillPath)) {
          continue;
        }

        const metadata = this._parseSkillMetadata(skillPath);
        const name = metadata.name ?? entry.name;

        // 检查依赖可用性
        const { available, missingDeps } = this._checkDependencies(metadata);

        const fullInfo: SkillFullInfo = {
          name,
          path: skillPath,
          source,
          metadata,
          available,
          missingDeps,
        };

        // 工作区技能覆盖内置技能
        this.skillsCache!.set(name, fullInfo);
      }
    } catch {
      // 目录读取失败，忽略
    }
  }

  /**
   * 解析技能元数据
   * @param skillPath SKILL.md 文件路径
   * @returns 解析后的元数据
   */
  private _parseSkillMetadata(skillPath: string): SkillMetadata {
    try {
      const content = readFileSync(skillPath, "utf-8");
      const frontmatter = this._extractFrontmatter(content);

      if (!frontmatter) {
        return {};
      }

      return this._parseYamlFrontmatter(frontmatter);
    } catch {
      return {};
    }
  }

  /**
   * 提取 YAML frontmatter
   * @param content 文件内容
   * @returns frontmatter 内容，不存在则返回 null
   */
  private _extractFrontmatter(content: string): string | null {
    // 检查是否以 --- 开头
    if (!content.startsWith("---")) {
      return null;
    }

    // 查找结束的 ---
    const endIndex = content.indexOf("---", 3);
    if (endIndex === -1) {
      return null;
    }

    return content.slice(3, endIndex).trim();
  }

  /**
   * 解析 YAML frontmatter（安全模式）
   * @description 使用 js-yaml 库解析，禁止执行任意代码
   * @param yamlStr YAML 字符串
   * @returns 解析后的对象
   */
  private _parseYamlFrontmatter(yamlStr: string): SkillMetadata {
    try {
      // 使用安全模式，禁止执行任意代码和函数
      const parsed = yaml.load(yamlStr, {
        schema: yaml.FAILSAFE_SCHEMA,
      }) as Record<string, unknown>;

      // 处理 requires 字段
      if (parsed.requires && typeof parsed.requires === "object") {
        parsed.requires = this._normalizeRequires(
          parsed.requires as Record<string, unknown>,
        );
      }

      return parsed as SkillMetadata;
    } catch (error) {
      logger.warn({ error }, "YAML 解析失败");
      return {};
    }
  }

  /**
   * 规范化 requires 字段
   * @param requires 原始 requires 对象
   * @returns 规范化后的 requires
   */
  private _normalizeRequires(requires: Record<string, unknown>): {
    bins?: string[];
    env?: string[];
  } {
    const result: { bins?: string[]; env?: string[] } = {};

    if (Array.isArray(requires.bins)) {
      result.bins = requires.bins.filter(
        (item): item is string => typeof item === "string",
      );
    } else if (typeof requires.bins === "string") {
      result.bins = [requires.bins];
    }

    if (Array.isArray(requires.env)) {
      result.env = requires.env.filter(
        (item): item is string => typeof item === "string",
      );
    } else if (typeof requires.env === "string") {
      result.env = [requires.env];
    }

    return result;
  }

  /**
   * 去除 frontmatter
   * @param content 文件内容
   * @returns 去除 frontmatter 后的内容
   */
  private _stripFrontmatter(content: string): string {
    if (!content.startsWith("---")) {
      return content;
    }

    const endIndex = content.indexOf("---", 3);
    if (endIndex === -1) {
      return content;
    }

    return content.slice(endIndex + 3).trim();
  }

  /**
   * 检查技能依赖是否满足
   * @description 同时检查顶层 requires 和 nanobot 元数据中的 requires
   * @param metadata 技能元数据
   * @returns 可用性和缺失依赖
   */
  private _checkDependencies(metadata: SkillMetadata): {
    available: boolean;
    missingDeps: { bins: string[]; env: string[] };
  } {
    const missingDeps = {
      bins: [] as string[],
      env: [] as string[],
    };

    // 获取顶层 requires
    const requires = metadata.requires;

    // 获取 nanobot 元数据中的 requires
    const nanobotRequires =
      typeof metadata.nanobot === "object" &&
      metadata.nanobot !== null &&
      "requires" in metadata.nanobot
        ? (
            metadata.nanobot as {
              requires?: { bins?: string[]; env?: string[] };
            }
          ).requires
        : undefined;

    // 合并 CLI 工具依赖
    const bins = new Set<string>();
    if (requires?.bins) {
      requires.bins.forEach((b: string) => bins.add(b));
    }
    if (nanobotRequires?.bins) {
      nanobotRequires.bins.forEach((b: string) => bins.add(b));
    }

    // 合并环境变量依赖
    const envs = new Set<string>();
    if (requires?.env) {
      requires.env.forEach((e: string) => envs.add(e));
    }
    if (nanobotRequires?.env) {
      nanobotRequires.env.forEach((e: string) => envs.add(e));
    }

    // 检查 CLI 工具依赖
    for (const bin of bins) {
      if (!this._isBinAvailable(bin)) {
        missingDeps.bins.push(bin);
      }
    }

    // 检查环境变量依赖
    for (const envVar of envs) {
      if (!process.env[envVar]) {
        missingDeps.env.push(envVar);
      }
    }

    const available =
      missingDeps.bins.length === 0 && missingDeps.env.length === 0;

    return { available, missingDeps };
  }

  /**
   * 检查 CLI 工具是否可用
   * @param bin 工具名称
   * @returns 是否可用
   */
  private _isBinAvailable(bin: string): boolean {
    // 在 Node.js 中检查命令是否可用
    // 使用 which/where 命令
    try {
      // 使用同步方式检查
      // 简单实现：检查常见路径
      const pathEnv = process.env.PATH ?? "";
      const pathSeparator = process.platform === "win32" ? ";" : ":";
      const paths = pathEnv.split(pathSeparator);

      for (const p of paths) {
        const fullPath = join(p, bin);
        if (existsSync(fullPath)) {
          return true;
        }
        // Windows 下检查 .exe 扩展名
        if (process.platform === "win32") {
          if (existsSync(`${fullPath}.exe`) || existsSync(`${fullPath}.cmd`)) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 格式化技能为 XML 元素
   * @param skill 技能完整信息
   * @returns XML 字符串
   */
  private _formatSkillXml(skill: SkillFullInfo): string {
    const attrs: string[] = [
      `name="${skill.name}"`,
      `location="${skill.source}"`,
      `available="${skill.available}"`,
    ];

    const desc = skill.metadata.description ?? "";
    const descAttr = desc ? ` description="${this._escapeXml(desc)}"` : "";

    // 有缺失依赖时添加 requires 标签
    if (!skill.available) {
      const missing: string[] = [];
      if (skill.missingDeps.bins.length > 0) {
        missing.push(`bins: ${skill.missingDeps.bins.join(", ")}`);
      }
      if (skill.missingDeps.env.length > 0) {
        missing.push(`env: ${skill.missingDeps.env.join(", ")}`);
      }

      return `  <skill ${attrs.join(" ")}${descAttr}>\n    <requires>${this._escapeXml(missing.join("; "))}</requires>\n  </skill>`;
    }

    return `  <skill ${attrs.join(" ")}${descAttr} />`;
  }

  /**
   * 转义 XML 特殊字符
   * @param str 原始字符串
   * @returns 转义后的字符串
   */
  private _escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * 转换为简化技能信息
   * @param skill 完整技能信息
   * @returns 简化技能信息
   */
  private _toSkillInfo(skill: SkillFullInfo): SkillInfo {
    return {
      name: skill.name,
      path: skill.path,
      source: skill.source,
    };
  }
}

/**
 * 创建技能加载器实例的工厂函数
 * @param workspace 工作区根目录
 * @param builtinDir 内置技能目录（可选）
 * @returns SkillsLoader 实例
 */
export function createSkillsLoader(
  workspace: string,
  builtinDir?: string,
): SkillsLoader {
  return new SkillsLoader(workspace, builtinDir);
}
