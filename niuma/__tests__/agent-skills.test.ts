/**
 * 技能加载器测试
 */

// ==================== 内置库 ====================
import { join } from "path";
import { tmpdir } from "os";
import fs from "fs-extra";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== 本地模块 ====================
import { SkillsLoader, createSkillsLoader } from "../agent/skills";

describe("SkillsLoader", () => {
  let loader: SkillsLoader;
  let tempDir: string;
  let builtinDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `niuma-skills-test-${Date.now()}`);
    builtinDir = join(tempDir, "builtin");
    await fs.ensureDir(tempDir);
    await fs.ensureDir(builtinDir);
    loader = new SkillsLoader(tempDir, builtinDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  const createSkillFile = async (
    dir: string,
    name: string,
    content: string,
  ): Promise<string> => {
    const skillDir = join(dir, name);
    await fs.ensureDir(skillDir);
    const skillPath = join(skillDir, "SKILL.md");
    await fs.writeFile(skillPath, content, "utf-8");
    return skillPath;
  };

  describe("listSkills", () => {
    it("应该返回空数组当没有技能时", () => {
      const skills = loader.listSkills();
      expect(skills).toEqual([]);
    });

    it("应该列出内置技能", async () => {
      await createSkillFile(
        builtinDir,
        "test-skill",
        `---
name: test-skill
description: A test skill
---
# Test Skill Content`,
      );

      const skills = loader.listSkills();

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe("test-skill");
      expect(skills[0].source).toBe("builtin");
    });

    it("应该列出工作区技能", async () => {
      const workspaceSkillsDir = join(tempDir, "skills");
      await fs.ensureDir(workspaceSkillsDir);

      await createSkillFile(
        workspaceSkillsDir,
        "workspace-skill",
        `---
name: workspace-skill
---
# Workspace Skill`,
      );

      const skills = loader.listSkills();

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe("workspace-skill");
      expect(skills[0].source).toBe("workspace");
    });

    it("工作区技能应该覆盖同名内置技能", async () => {
      await createSkillFile(
        builtinDir,
        "shared-skill",
        `---
name: shared-skill
description: Built-in version
---
# Built-in Skill`,
      );

      const workspaceSkillsDir = join(tempDir, "skills");
      await fs.ensureDir(workspaceSkillsDir);

      await createSkillFile(
        workspaceSkillsDir,
        "shared-skill",
        `---
name: shared-skill
description: Workspace version
---
# Workspace Skill`,
      );

      const skills = loader.listSkills();

      expect(skills.length).toBe(1);
      expect(skills[0].source).toBe("workspace");
    });

    it("应该过滤不可用的技能", async () => {
      // 设置一个不存在的环境变量依赖
      await createSkillFile(
        builtinDir,
        "skill-with-deps",
        `---
name: skill-with-deps
requires:
  env:
    - NON_EXISTENT_ENV_VAR_12345
---
# Skill with dependencies`,
      );

      const allSkills = loader.listSkills();
      const availableSkills = loader.listSkills(true);

      expect(allSkills.length).toBe(1);
      expect(availableSkills.length).toBe(0);
    });
  });

  describe("loadSkill", () => {
    it("应该返回 null 如果技能不存在", () => {
      const content = loader.loadSkill("non-existent");
      expect(content).toBeNull();
    });

    it("应该返回技能内容（不含 frontmatter）", async () => {
      await createSkillFile(
        builtinDir,
        "test-skill",
        `---
name: test-skill
---
# Test Skill

This is the content.`,
      );

      const content = loader.loadSkill("test-skill");

      expect(content).not.toContain("---");
      expect(content).toContain("# Test Skill");
      expect(content).toContain("This is the content.");
    });

    it("应该返回原始内容如果没有 frontmatter", async () => {
      await createSkillFile(
        builtinDir,
        "no-frontmatter",
        `# No Frontmatter

Just plain content.`,
      );

      const content = loader.loadSkill("no-frontmatter");

      expect(content).toContain("# No Frontmatter");
    });
  });

  describe("loadSkillsForContext", () => {
    it("应该返回格式化的多个技能内容", async () => {
      await createSkillFile(
        builtinDir,
        "skill-a",
        `---
name: skill-a
---
Content A`,
      );

      await createSkillFile(
        builtinDir,
        "skill-b",
        `---
name: skill-b
---
Content B`,
      );

      const context = loader.loadSkillsForContext(["skill-a", "skill-b"]);

      expect(context).toContain("--- SKILL: skill-a ---");
      expect(context).toContain("Content A");
      expect(context).toContain("--- SKILL: skill-b ---");
      expect(context).toContain("Content B");
    });

    it("应该跳过不存在的技能", () => {
      const context = loader.loadSkillsForContext(["non-existent"]);

      expect(context).toBe("");
    });
  });

  describe("buildSkillsSummary", () => {
    it("应该返回空技能摘要", () => {
      const summary = loader.buildSkillsSummary();

      expect(summary).toContain("<skills>");
      expect(summary).toContain("(no skills available)");
    });

    it("应该返回 XML 格式的技能摘要", async () => {
      await createSkillFile(
        builtinDir,
        "test-skill",
        `---
name: test-skill
description: Test description
---
Content`,
      );

      const summary = loader.buildSkillsSummary();

      expect(summary).toContain("<skills>");
      expect(summary).toContain('name="test-skill"');
      expect(summary).toContain('location="builtin"');
      expect(summary).toContain("</skills>");
    });
  });

  describe("getSkillMetadata", () => {
    it("应该返回 null 如果技能不存在", () => {
      const metadata = loader.getSkillMetadata("non-existent");
      expect(metadata).toBeNull();
    });

    it("应该返回技能元数据", async () => {
      await createSkillFile(
        builtinDir,
        "meta-skill",
        `---
name: meta-skill
description: Skill with metadata
requires:
  bins:
    - git
  env:
    - API_KEY
custom_field: custom_value
---
Content`,
      );

      const metadata = loader.getSkillMetadata("meta-skill");

      expect(metadata?.name).toBe("meta-skill");
      expect(metadata?.description).toBe("Skill with metadata");
      expect(metadata?.requires?.bins).toContain("git");
      expect(metadata?.requires?.env).toContain("API_KEY");
      expect((metadata as any)?.custom_field).toBe("custom_value");
    });
  });

  describe("refresh", () => {
    it("应该重新扫描技能目录", async () => {
      // 初始加载
      let skills = loader.listSkills();
      expect(skills.length).toBe(0);

      // 添加新技能
      await createSkillFile(
        builtinDir,
        "new-skill",
        `---
name: new-skill
---
New content`,
      );

      // 刷新缓存
      loader.refresh();

      // 再次列出
      skills = loader.listSkills();
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe("new-skill");
    });
  });

  describe("依赖检查", () => {
    it("应该检测缺失的 CLI 工具", async () => {
      await createSkillFile(
        builtinDir,
        "skill-needs-bin",
        `---
name: skill-needs-bin
requires:
  bins:
    - definitely_not_existing_command_12345
---
Content`,
      );

      const skills = loader.listSkills();
      const skill = skills.find((s) => s.name === "skill-needs-bin");

      expect(skill).toBeDefined();
      // 该技能应该不可用
    });

    it("应该检测缺失的环境变量", async () => {
      await createSkillFile(
        builtinDir,
        "skill-needs-env",
        `---
name: skill-needs-env
requires:
  env:
    - DEFINITELY_NOT_SET_ENV_VAR_12345
---
Content`,
      );

      const skills = loader.listSkills();
      const skill = skills.find((s) => s.name === "skill-needs-env");

      expect(skill).toBeDefined();
      // 该技能应该不可用
    });
  });

  describe("createSkillsLoader", () => {
    it("应该创建 SkillsLoader 实例", () => {
      const instance = createSkillsLoader(tempDir, builtinDir);
      expect(instance).toBeInstanceOf(SkillsLoader);
    });

    it("应该使用默认内置目录", () => {
      const instance = createSkillsLoader(tempDir);
      expect(instance).toBeInstanceOf(SkillsLoader);
    });
  });

  describe("YAML 解析安全", () => {
    it("应该安全处理无效的 YAML", async () => {
      await createSkillFile(
        builtinDir,
        "invalid-yaml",
        `---
name: invalid-yaml
invalid yaml content: [unclosed
---
Content`,
      );

      // 不应该抛出错误
      const skills = loader.listSkills();
      expect(skills.length).toBe(1);
    });

    it("应该处理空的 frontmatter", async () => {
      await createSkillFile(
        builtinDir,
        "empty-frontmatter",
        `---
---
Content without metadata`,
      );

      const skills = loader.listSkills();
      const skill = skills.find((s) => s.name === "empty-frontmatter");

      expect(skill).toBeDefined();
    });
  });
});
