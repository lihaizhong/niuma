## ADDED Requirements

### Requirement: JsonParse JSON 解析工具
系统 MUST 提供 JsonParse 工具，允许用户解析 JSON 字符串。

#### Scenario: 成功解析标准 JSON
- **WHEN** 用户调用 json_parse 工具，指定 data 为有效的 JSON 字符串
- **THEN** 系统解析 JSON 字符串
- **AND** 返回解析后的 JavaScript 对象

#### Scenario: 成功解析 JSON5 格式
- **WHEN** 用户调用 json_parse 工具，指定 data 为包含注释或尾随逗号的 JSON5 字符串
- **THEN** 系统解析 JSON5 字符串
- **AND** 返回解析后的 JavaScript 对象

#### Scenario: JSON 解析失败
- **WHEN** 用户调用 json_parse 工具，指定的 data 不是有效的 JSON 或 JSON5 字符串
- **THEN** 系统拒绝解析操作
- **AND** 返回错误消息，说明 JSON 格式无效

#### Scenario: 空字符串输入
- **WHEN** 用户调用 json_parse 工具，指定的 data 为空字符串
- **THEN** 系统拒绝解析操作
- **AND** 返回错误消息，说明输入不能为空

### Requirement: JsonStringify JSON 序列化工具
系统 MUST 提供 JsonStringify 工具，允许用户将对象序列化为 JSON 字符串。

#### Scenario: 成功序列化对象
- **WHEN** 用户调用 json_stringify 工具，指定 data 为 JavaScript 对象，indent 为 2
- **THEN** 系统序列化对象为 JSON 字符串
- **AND** 返回格式化的 JSON 字符串，缩进为 2 个空格

#### Scenario: 成功序列化复杂对象
- **WHEN** 用户调用 json_stringify 工具，指定 data 为包含嵌套对象的复杂数据结构
- **THEN** 系统序列化对象为 JSON 字符串
- **AND** 返回完整的 JSON 字符串，保留所有嵌套结构

#### Scenario: 序列化包含特殊字符的对象
- **WHEN** 用户调用 json_stringify 工具，指定的 data 包含特殊字符（如换行符、引号等）
- **THEN** 系统正确转义特殊字符
- **AND** 返回有效的 JSON 字符串

#### Scenario: 序列化循环引用对象
- **WHEN** 用户调用 json_stringify 工具，指定的 data 包含循环引用
- **THEN** 系统拒绝序列化操作
- **AND** 返回错误消息，说明对象包含循环引用

### Requirement: YamlParse YAML 解析工具
系统 MUST 提供 YamlParse 工具，允许用户解析 YAML 字符串。

#### Scenario: 成功解析标准 YAML
- **WHEN** 用户调用 yaml_parse 工具，指定 data 为有效的 YAML 字符串
- **THEN** 系统解析 YAML 字符串
- **AND** 返回解析后的 JavaScript 对象

#### Scenario: 成功解析复杂 YAML 结构
- **WHEN** 用户调用 yaml_parse 工具，指定 data 为包含列表、嵌套对象的复杂 YAML 字符串
- **THEN** 系统解析 YAML 字符串
- **AND** 返回完整的 JavaScript 对象，保留所有嵌套结构

#### Scenario: YAML 解析失败
- **WHEN** 用户调用 yaml_parse 工具，指定的 data 不是有效的 YAML 字符串
- **THEN** 系统拒绝解析操作
- **AND** 返回错误消息，说明 YAML 格式无效

#### Scenario: 空字符串输入
- **WHEN** 用户调用 yaml_parse 工具，指定的 data 为空字符串
- **THEN** 系统拒绝解析操作
- **AND** 返回错误消息，说明输入不能为空

### Requirement: YamlStringify YAML 序列化工具
系统 MUST 提供 YamlStringify 工具，允许用户将对象序列化为 YAML 字符串。

#### Scenario: 成功序列化对象
- **WHEN** 用户调用 yaml_stringify 工具，指定 data 为 JavaScript 对象，indent 为 2
- **THEN** 系统序列化对象为 YAML 字符串
- **AND** 返回格式化的 YAML 字符串，缩进为 2 个空格

#### Scenario: 成功序列化复杂对象
- **WHEN** 用户调用 yaml_stringify 工具，指定 data 为包含嵌套对象的复杂数据结构
- **THEN** 系统序列化对象为 YAML 字符串
- **AND** 返回完整的 YAML 字符串，保留所有嵌套结构

#### Scenario: 序列化包含特殊值的对象
- **WHEN** 用户调用 yaml_stringify 工具，指定的 data 包含特殊值（如 null、undefined、Date 等）
- **THEN** 系统正确处理特殊值
- **AND** 返回有效的 YAML 字符串

#### Scenario: 序列化循环引用对象
- **WHEN** 用户调用 yaml_stringify 工具，指定的 data 包含循环引用
- **THEN** 系统拒绝序列化操作
- **AND** 返回错误消息，说明对象包含循环引用