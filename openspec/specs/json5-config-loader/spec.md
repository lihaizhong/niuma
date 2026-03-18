# Json5 Config Loader Specification

## Purpose

定义 Json5 Config Loader 的功能规格和行为约束。

## Requirements

### Requirement: JSON5 配置文件加载
系统 SHALL 能够加载和解析 JSON5 格式的配置文件，支持注释和尾随逗号。

#### Scenario: 成功加载有效的 JSON5 配置文件
- **WHEN** 用户提供一个有效的 JSON5 配置文件，包含注释和尾随逗号
- **THEN** 系统成功解析配置文件并返回配置对象
- **AND** 注释被忽略，不影响配置内容
- **AND** 尾随逗号被正确处理

#### Scenario: JSON5 配置文件包含单行注释
- **WHEN** JSON5 配置文件包含单行注释（`// comment`）
- **THEN** 系统成功解析配置文件
- **AND** 注释内容被忽略

#### Scenario: JSON5 配置文件包含多行注释
- **WHEN** JSON5 配置文件包含多行注释（`/* comment */`）
- **THEN** 系统成功解析配置文件
- **AND** 注释内容被忽略

#### Scenario: JSON5 配置文件包含尾随逗号
- **WHEN** JSON5 配置文件的对象或数组包含尾随逗号
- **THEN** 系统成功解析配置文件
- **AND** 尾随逗号被正确处理

#### Scenario: 配置文件不存在时返回默认配置
- **WHEN** 指定的配置文件路径不存在
- **THEN** 系统返回默认的空配置对象
- **AND** 不抛出错误

#### Scenario: JSON5 配置文件语法错误
- **WHEN** JSON5 配置文件包含语法错误
- **THEN** 系统抛出清晰的错误信息，包含文件路径和错误原因
- **AND** 错误信息指出具体的语法错误位置

### Requirement: 向后兼容 JSON 格式
系统 SHALL 能够同时支持 JSON 和 JSON5 格式的配置文件。

#### Scenario: 加载有效的 JSON 配置文件
- **WHEN** 用户提供一个标准的 JSON 配置文件
- **THEN** 系统成功解析配置文件并返回配置对象
- **AND** 行为与 JSON5 格式一致

#### Scenario: JSON 配置文件不包含注释
- **WHEN** JSON 配置文件不包含任何注释
- **THEN** 系统成功解析配置文件
- **AND** 不要求转换为 JSON5 格式

### Requirement: 配置文件路径解析
系统 SHALL 支持相对路径和绝对路径的配置文件。

#### Scenario: 使用相对路径加载配置文件
- **WHEN** 用户提供相对路径的配置文件
- **THEN** 系统相对于当前工作目录解析路径
- **AND** 成功加载配置文件

#### Scenario: 使用绝对路径加载配置文件
- **WHEN** 用户提供绝对路径的配置文件
- **THEN** 系统直接使用该路径加载配置文件
- **AND** 成功加载配置文件

#### Scenario: 使用默认路径加载配置文件
- **WHEN** 用户不提供配置文件路径
- **THEN** 系统使用默认路径 `~/.niuma/niuma.json`
- **AND** 如果文件不存在，返回默认配置

## TypeScript Interface Definitions

```typescript
/**
 * JSON5 配置加载器接口
 */
interface JSON5ConfigLoader {
  /**
   * 加载并解析 JSON5 配置文件
   * @param configPath 配置文件路径（可选，默认为 ~/.niuma/niuma.json）
   * @returns 解析后的配置对象
   * @throws 配置文件不存在或解析失败时抛出错误
   */
  load(configPath?: string): unknown

  /**
   * 检查配置文件是否存在
   * @param configPath 配置文件路径
   * @returns 文件是否存在
   */
  exists(configPath: string): boolean
}
```

## Dependencies

- `multi-role-config`: 依赖 JSON5 配置加载器来加载多角色配置
- `config-manager`: 依赖 JSON5 配置加载器来加载配置文件