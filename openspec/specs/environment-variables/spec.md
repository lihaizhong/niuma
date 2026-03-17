# Environment Variables Specification

## Purpose

定义 Environment Variables 的功能规格和行为约束。

## Requirements

### Requirement: 读取环境变量
系统 SHALL 提供 `env_get` 工具，用于读取当前进程的环境变量。

**工具参数：**
- `name` (string, required): 环境变量名称

**返回值：**
- `value` (string | null): 环境变量的值，如果不存在则返回 null

#### Scenario: 成功读取存在的环境变量
- **WHEN** 用户调用 `env_get` 工具，参数 `name` 为 "HOME"
- **THEN** 系统返回 HOME 环境变量的值

#### Scenario: 读取不存在的环境变量
- **WHEN** 用户调用 `env_get` 工具，参数 `name` 为 "NONEXISTENT_VAR"
- **THEN** 系统返回 null

#### Scenario: 参数验证失败
- **WHEN** 用户调用 `env_get` 工具，未提供 `name` 参数
- **THEN** 系统返回错误："缺少必需参数：name"

### Requirement: 设置环境变量
系统 SHALL 提供 `env_set` 工具，用于设置当前进程的环境变量。

**工具参数：**
- `name` (string, required): 环境变量名称
- `value` (string, required): 环境变量的值

**返回值：**
- `success` (boolean): 操作是否成功
- `message` (string): 操作结果描述

**限制：**
- 只修改当前进程的环境变量，不影响子进程或父进程
- 环境变量名称必须符合命名规范（字母、数字、下划线，不以数字开头）

#### Scenario: 成功设置环境变量
- **WHEN** 用户调用 `env_set` 工具，参数 `name` 为 "MY_VAR"，`value` 为 "test_value"
- **THEN** 系统返回 `{"success": true, "message": "环境变量 MY_VAR 已设置"}`

#### Scenario: 覆盖现有环境变量
- **WHEN** 用户调用 `env_set` 工具，参数 `name` 为 "PATH"，`value` 为 "/new/path"
- **THEN** 系统返回 `{"success": true, "message": "环境变量 PATH 已更新"}`

#### Scenario: 参数验证失败 - 缺少 name
- **WHEN** 用户调用 `env_set` 工具，未提供 `name` 参数
- **THEN** 系统返回错误："缺少必需参数：name"

#### Scenario: 参数验证失败 - 缺少 value
- **WHEN** 用户调用 `env_set` 工具，未提供 `value` 参数
- **THEN** 系统返回错误："缺少必需参数：value"

#### Scenario: 环境变量名称格式无效
- **WHEN** 用户调用 `env_set` 工具，参数 `name` 为 "123INVALID"
- **THEN** 系统返回错误："环境变量名称格式无效：必须以字母或下划线开头，只能包含字母、数字和下划线"

#### Scenario: 环境变量名称格式无效 - 包含非法字符
- **WHEN** 用户调用 `env_set` 工具，参数 `name` 为 "MY-VAR"
- **THEN** 系统返回错误："环境变量名称格式无效：必须以字母或下划线开头，只能包含字母、数字和下划线"