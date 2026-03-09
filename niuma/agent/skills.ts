import path from "path";
import fs from "fs-extra";
import which from "which";

export class SkillsLoader {
  workspace: string;

  workspaceSkills: string;

  builtInSkills: string;

  /**
   * Loader for agent skills.
   *
   * Skills are markdown files (SKILL.md) that teach agent how to use specific tools or perform certain tasks.
   *
   * @param {string} workspace - Agent workspace directory, where custom skills can be placed under skills/ subdirectory.
   * @param {string=} builtSkillsDir - Optional directory for built-in skills (defaults to ../skills relative to this file). Built-in skills are used if not found in workspace.
   */
  constructor(workspace: string, builtSkillsDir?: string) {
    this.workspace = workspace;
    this.workspaceSkills = path.resolve(workspace, "skills");
    this.builtInSkills =
      builtSkillsDir || path.resolve(__dirname, "..", "skills");
  }

  /**
   * List all available skills.
   *
   * @param {boolean=} filterUnavailable - If true, filter out skills with unmet requirements.
   * @returns {Array.<Object.<string, string>>} - List of skill info dicts with 'name', 'path', 'source'.
   */
  listSkills(filterUnavailable: boolean = true): Record<string, string>[] {
    const skills = [];

    // Workspace skills (highest priority)
    if (fs.pathExistsSync(this.workspaceSkills)) {
      const skillDirs = fs.readdirSync(this.workspaceSkills, {
        withFileTypes: true,
      });

      for (const skillDir of skillDirs) {
        if (
          fs
            .statSync(path.join(skillDir.parentPath, skillDir.name))
            .isDirectory()
        ) {
          const skillFile = path.resolve(
            skillDir.parentPath,
            skillDir.name,
            "SKILL.md",
          );

          if (fs.pathExistsSync(skillFile)) {
            skills.push({
              name: skillDir.name,
              path: skillFile,
              source: "workspace",
            });
          }
        }
      }
    }

    if (fs.pathExistsSync(this.builtInSkills)) {
      for (const skillDir of fs.readdirSync(this.builtInSkills, {
        withFileTypes: true,
      })) {
        if (
          fs
            .statSync(path.join(skillDir.parentPath, skillDir.name))
            .isDirectory()
        ) {
          const skillFile = path.resolve(
            skillDir.parentPath,
            skillDir.name,
            "SKILL.md",
          );

          if (fs.pathExistsSync(skillFile)) {
            skills.push({
              name: skillDir.name,
              path: skillFile,
              source: "built-in",
            });
          }
        }
      }
    }

    // Filter by requirements
    if (filterUnavailable) {
      return skills
        .map((skill) => this.getSkillMeta(skill.name))
        .filter((meta) => this.checkRequirements(meta));
    }

    return skills;
  }

  /**
   * Load a skill by name.
   *
   * @param {string} name - Skill name (directory name under skills/).
   * @returns {string | null} Skill - content or null if not found.
   */
  loadSkill(name: string): string | null {
    // Check workspace first
    const workspaceSkill = path.resolve(this.workspaceSkills, name, "SKILL.md");

    if (fs.pathExistsSync(workspaceSkill)) {
      return fs.readFileSync(workspaceSkill, "utf-8");
    }

    // Check built-in
    if (this.builtInSkills) {
      const builtInSkill = path.resolve(this.builtInSkills, name, "SKILL.md");

      if (fs.pathExistsSync(builtInSkill)) {
        return fs.readFileSync(builtInSkill, "utf-8");
      }
    }

    return null;
  }

  /**
   * Load specific skills for inclusion in agent context.
   *
   * @param {Array.<string>} skillNames - skillNames List of skill names to load.
   * @returns {string} - Formatted skills content.
   */
  loadSkillsForContext(skillNames: string[]): string {
    const parts = [];

    for (const name of skillNames) {
      let content = this.loadSkill(name);

      if (content) {
        content = this.stripFrontmatter(content);
        parts.push(`## Skill: ${name}\n\n${content}`);
      }
    }

    if (parts.length) {
      return parts.join("\n\n---\n\n");
    }

    return "";
  }

  /**
   * Build a summary of all skills (name, description, path, availability).
   *
   * This is used for progressive loading - the agent can read the full skill content using read_file when needed.
   *
   * @returns {string} - XML-formatted skills summary.
   */
  buildSkillsSummary(): string {
    const allSkills = this.listSkills(false);

    if (!allSkills.length) {
      return "";
    }

    function escapeXML(s: string): string {
      return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    const lines = ["<skills>"];

    for (const s of allSkills) {
      const { path } = s;
      const name = escapeXML(s.name);
      const desc = escapeXML(this.getSkillDescription(s.name));
      const skillMeta = this.getSkillMeta(s.name);
      const available = this.checkRequirements(skillMeta);

      lines.push(`  <skill available="${available}">`);
      lines.push(`    <name>${name}</name>`);
      lines.push(`    <description>${desc}</description>`);
      lines.push(`    <location>${path}</location>`);

      // Show missing requirements for unavailable skills
      if (!available) {
        const missing = this.getMissingRequirements(skillMeta);

        if (missing) {
          lines.push(`      <requires>${escapeXML(missing)}</requires>`);
        }
      }

      lines.push("  </skill>");
    }

    lines.push("</skill>");

    return lines.join("\n");
  }

  /**
   * Get a description of missing requirements.
   *
   * @param {Object.<string, any>} skillMeta
   * @returns {string}
   */
  private getMissingRequirements(skillMeta: Record<string, any>): string {
    const missing = [];
    const requires = skillMeta.requires || {};

    for (const b in requires.bins || []) {
      if (which.sync(b, { nothrow: true }) === null) {
        missing.push(`CLI: ${b}`);
      }
    }

    for (const env in requires.env || []) {
      if (!process.env[env]) {
        missing.push(`ENV: ${env}`);
      }
    }

    return missing.join(", ");
  }

  /**
   * Get the description of a skill from its frontmatter
   *
   * @param {string} name
   * @returns {string}
   */
  private getSkillDescription(name: string): string {
    const meta = this.getSkillMetadata(name);

    if (meta?.description) {
      return meta.description;
    }

    // Fallback to skill name
    return name;
  }

  /**
   * Remove YAML frontmatter from markdown content.
   *
   * @param {string} content
   * @returns {string}
   */
  private stripFrontmatter(content: string): string {
    if (content.startsWith("----")) {
      const match = content.match(/^---\n.*?\n---\n/s);

      if (match) {
        return content.slice(match.index! + match[0].length).trim();
      }
    }

    return content;
  }

  /**
   * Parse skill metadata JSON from frontmatter (supports niuma keys).
   *
   * @param {string} raw
   * @returns {Object.<string, any>}
   */
  private parseNiumaMetadata(raw: string): Record<string, any> {
    try {
      const data = JSON.parse(raw);

      if (typeof data === "object" && data !== null) {
        return data.niuma || {};
      }

      return {};
    } catch {
      return {};
    }
  }

  /**
   * Check if skill requirements are met (bins, env vars).
   *
   * @param {Object.<string, ayn>} skillMeta
   * @returns {boolean}
   */
  private checkRequirements(skillMeta: Record<string, any>): boolean {
    const requires = skillMeta.requires || {};

    for (const b in requires.bins || []) {
      if (!which.sync(b)) {
        return false;
      }
    }

    for (const env in requires.env || []) {
      if (!process.env[env]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get niuma metadata for a skill (cached in frontmatter).
   * 
   * @param {string} name
   * @returns {Object.<string, any>}
   */
  private getSkillMeta(name: string): Record<string, any> {
    const meta = this.getSkillMetadata(name) || {};

    return this.parseNiumaMetadata(meta.metadata || "");
  }

  /**
   * Get skills marked as always=true that meet requirements.
   * 
   * @returns {Array.<string>}
   */
  getAlwaysSkills(): string[] {
    const result: string[] = [];

    for (const s of this.listSkills(true)) {
      const meta = this.getSkillMetadata(s.name) || {};
      const skillMeta = this.parseNiumaMetadata(meta.metadata || "");

      if (skillMeta.always || meta.always) {
        result.push(s.name);
      }
    }

    return result;
  }

  /**
   * Get metadata from a skill's frontmatter.
   * 
   * @param {string} name - Skill name.
   * @returns {Object.<string, any> | null} - Metadata dict or None.
   */
  private getSkillMetadata(name: string): Record<string, any> | null {
    const content = this.loadSkill(name);

    if (!content) {
      return null;
    }

    // Simple YAML parsing
    const metadata: Record<string, string> = {};

    if (content.startsWith("---")) {
      const match = content.match(/^---\n(.*?)\n---/s);

      if (match) {
        for (const line of match[1].split("\n")) {
          if (line.includes(":")) {
            const [key, value] = line.split("\n", 1);

            metadata[key.trim()] = value.trim().replace("'\"", "");
          }
        }

        return metadata;
      }
    }

    return metadata;
  }
}
