# Class: SkillsLoader

Defined in: [niuma/agent/skills.ts:77](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L77)

技能加载器
发现、加载和管理技能
工作区技能位置：workspace/skills/
内置技能位置：代码包中的 skills 目录

## Constructors

### Constructor

```ts
new SkillsLoader(workspace, builtinDir?): SkillsLoader;
```

Defined in: [niuma/agent/skills.ts:98](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L98)

创建技能加载器实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `workspace` | `string` | 工作区根目录 |
| `builtinDir?` | `string` | 内置技能目录（可选，默认为 niuma/skills） |

#### Returns

`SkillsLoader`

## Methods

### buildSkillsSummary()

```ts
buildSkillsSummary(): string;
```

Defined in: [niuma/agent/skills.ts:178](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L178)

构建 XML 格式的技能摘要

#### Returns

`string`

XML 格式的技能摘要

***

### getSkillMetadata()

```ts
getSkillMetadata(name): SkillMetadata | null;
```

Defined in: [niuma/agent/skills.ts:203](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L203)

获取技能元数据

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 技能名称 |

#### Returns

`SkillMetadata` \| `null`

元数据，不存在则返回 null

***

### listSkills()

```ts
listSkills(filterUnavailable?): SkillInfo[];
```

Defined in: [niuma/agent/skills.ts:113](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L113)

列出所有技能

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `filterUnavailable` | `boolean` | `false` | 是否过滤不可用的技能（依赖不满足） |

#### Returns

`SkillInfo`[]

技能信息列表

***

### loadSkill()

```ts
loadSkill(name): string | null;
```

Defined in: [niuma/agent/skills.ts:134](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L134)

加载技能内容（去除 frontmatter）

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 技能名称 |

#### Returns

`string` \| `null`

技能内容，不存在则返回 null

***

### loadSkillsForContext()

```ts
loadSkillsForContext(skillNames): string;
```

Defined in: [niuma/agent/skills.ts:155](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L155)

加载多个技能内容用于上下文注入

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `skillNames` | `string`[] | 技能名称列表 |

#### Returns

`string`

格式化的技能内容

***

### refresh()

```ts
refresh(): void;
```

Defined in: [niuma/agent/skills.ts:218](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/skills.ts#L218)

刷新技能缓存
强制重新扫描技能目录

#### Returns

`void`
