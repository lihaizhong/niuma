## ADDED Requirements

### Requirement: 技能发现

SkillsLoader SHALL 能够发现工作区和内置技能目录中的所有技能。

#### Scenario: 列出工作区技能

- **WHEN** 工作区存在 `skills/weather/SKILL.md`
- **THEN** `listSkills()` 返回包含该技能的列表

#### Scenario: 列出内置技能

- **WHEN** 内置技能目录存在 `skills/github/SKILL.md`
- **THEN** `listSkills()` 返回包含该技能的列表

#### Scenario: 工作区技能优先

- **WHEN** 工作区和内置目录都有同名技能
- **THEN** 只返回工作区版本

### Requirement: 依赖检查

SkillsLoader SHALL 检查技能声明的依赖是否满足。

#### Scenario: 检查 CLI 工具依赖

- **WHEN** 技能元数据声明 `requires.bins: ["gh"]` 且 `gh` 在 PATH 中
- **THEN** `listSkills(filterUnavailable=true)` 包含该技能

#### Scenario: 检查环境变量依赖

- **WHEN** 技能元数据声明 `requires.env: ["GITHUB_TOKEN"]` 且环境变量未设置
- **THEN** `listSkills(filterUnavailable=true)` 不包含该技能

### Requirement: 技能加载

SkillsLoader SHALL 支持加载技能内容（去除 frontmatter）。

#### Scenario: 加载技能内容

- **WHEN** 调用 `loadSkill("github")`
- **THEN** 返回 SKILL.md 内容（去除 YAML frontmatter）

#### Scenario: 技能不存在

- **WHEN** 调用 `loadSkill("nonexistent")`
- **THEN** 返回 null

### Requirement: 技能摘要

SkillsLoader SHALL 生成 XML 格式的技能摘要供 Agent 参考。

#### Scenario: 生成技能摘要

- **WHEN** 调用 `buildSkillsSummary()`
- **THEN** 返回 XML 格式的技能列表，包含 name, description, location, available 属性

#### Scenario: 显示缺失依赖

- **WHEN** 技能不可用
- **THEN** 摘要中包含 `<requires>` 标签显示缺失的依赖

### Requirement: Always 技能

SkillsLoader SHALL 识别标记为 `always=true` 的技能并自动注入上下文。

#### Scenario: 获取 Always 技能

- **WHEN** 技能元数据设置 `always: true` 且依赖满足
- **THEN** `getAlwaysSkills()` 返回该技能名称

#### Scenario: 加载 Always 技能内容

- **WHEN** 调用 `loadSkillsForContext(["skill-a", "skill-b"])`
- **THEN** 返回格式化的技能内容，用分隔线隔开

### Requirement: 元数据解析

SkillsLoader SHALL 从 SKILL.md 的 frontmatter 解析元数据。

#### Scenario: 解析 YAML frontmatter

- **WHEN** SKILL.md 以 `---` 开头
- **THEN** `getSkillMetadata()` 返回解析后的元数据字典

#### Scenario: 解析 nanobot 特定元数据

- **WHEN** frontmatter 包含 `nanobot: |` 或 `metadata:`
- **THEN** 元数据包含解析后的 JSON 对象

---

## TypeScript Interfaces

```typescript
interface SkillsLoader {
  listSkills(filterUnavailable?: boolean): SkillInfo[]
  loadSkill(name: string): string | null
  loadSkillsForContext(skillNames: string[]): string
  buildSkillsSummary(): string
  getAlwaysSkills(): string[]
  getSkillMetadata(name: string): SkillMetadata | null
}

interface SkillInfo {
  name: string
  path: string
  source: 'workspace' | 'builtin'
}

interface SkillMetadata {
  name?: string
  description?: string
  always?: boolean
  requires?: {
    bins?: string[]
    env?: string[]
  }
}
```

## Dependencies

- 无外部模块依赖
