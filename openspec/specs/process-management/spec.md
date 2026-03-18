# Process Management Specification

## Purpose

定义 Process Management 的功能规格和行为约束。

## Requirements

### Requirement: 列出系统进程
系统 SHALL 提供 `process_list` 工具，用于列出系统进程。

**工具参数：**
- `filter` (string, optional): 进程名称过滤（支持部分匹配）
- `limit` (number, optional): 返回进程数量限制（默认 50，最大 100）

**返回值：**
- `processes` (array): 进程列表
  - `pid` (number): 进程 ID
  - `ppid` (number): 父进程 ID
  - `name` (string): 进程名称
  - `command` (string): 完整命令行
  - `cpu` (number): CPU 使用率（百分比）
  - `memory` (number): 内存使用量（MB）

#### Scenario: 列出所有进程（无过滤）
- **WHEN** 用户调用 `process_list` 工具，不提供任何参数
- **THEN** 系统返回最多 50 个进程的列表

#### Scenario: 按名称过滤进程
- **WHEN** 用户调用 `process_list` 工具，参数 `filter` 为 "node"
- **THEN** 系统返回名称包含 "node" 的进程列表

#### Scenario: 限制返回数量
- **WHEN** 用户调用 `process_list` 工具，参数 `limit` 为 10
- **THEN** 系统返回最多 10 个进程

#### Scenario: 过滤和限制同时使用
- **WHEN** 用户调用 `process_list` 工具，参数 `filter` 为 "chrome"，`limit` 为 5
- **THEN** 系统返回最多 5 个名称包含 "chrome" 的进程

#### Scenario: 超过最大限制
- **WHEN** 用户调用 `process_list` 工具，参数 `limit` 为 200
- **THEN** 系统返回错误："limit 参数不能超过 100"

#### Scenario: 未找到匹配进程
- **WHEN** 用户调用 `process_list` 工具，参数 `filter` 为 "nonexistent_process_12345"
- **THEN** 系统返回空数组 `{"processes": []}`

### Requirement: 终止进程
系统 SHALL 提供 `process_kill` 工具，用于终止指定进程。

**工具参数：**
- `pid` (number, required): 进程 ID
- `signal` (string, optional): 终止信号（"SIGTERM" 或 "SIGKILL"，默认 "SIGTERM"）
- `killTree` (boolean, optional): 是否终止进程树（包括子进程，默认 false）
- `confirm` (boolean, optional): 确认标志（默认 false）

**返回值：**
- `success` (boolean): 操作是否成功
- `message` (string): 操作结果描述
- `killedProcesses` (array): 被终止的进程列表
  - `pid` (number): 进程 ID
  - `name` (string): 进程名称

**限制：**
- 不能终止系统关键进程（如 init、kernel 进程）
- 受保护进程列表包括：PID 1（init/systemd）、当前 Niuma 进程
- 如果 `confirm` 为 false，只提供进程信息预览，不实际终止

#### Scenario: 成功终止进程（SIGTERM）
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为 12345，`confirm` 为 true
- **THEN** 系统发送 SIGTERM 信号终止进程，返回成功结果

#### Scenario: 强制终止进程（SIGKILL）
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为 12345，`signal` 为 "SIGKILL"，`confirm` 为 true
- **THEN** 系统发送 SIGKILL 信号强制终止进程，返回成功结果

#### Scenario: 终止进程树
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为 12345，`killTree` 为 true，`confirm` 为 true
- **THEN** 系统终止目标进程及其所有子进程，返回所有被终止的进程列表

#### Scenario: 参数验证失败 - 缺少 pid
- **WHEN** 用户调用 `process_kill` 工具，未提供 `pid` 参数
- **THEN** 系统返回错误："缺少必需参数：pid"

#### Scenario: 参数验证失败 - 无效的信号
- **WHEN** 用户调用 `process_kill` 工具，参数 `signal` 为 "INVALID_SIGNAL"
- **THEN** 系统返回错误："无效的信号：只支持 SIGTERM 或 SIGKILL"

#### Scenario: 尝试终止受保护进程（PID 1）
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为 1，`confirm` 为 true
- **THEN** 系统返回错误："不能终止受保护的系统进程"

#### Scenario: 尝试终止自身进程
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为当前 Niuma 进程 PID，`confirm` 为 true
- **THEN** 系统返回错误："不能终止 Niuma 自身进程"

#### Scenario: 未找到进程
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为 99999999，`confirm` 为 true
- **THEN** 系统返回错误："未找到 PID 为 99999999 的进程"

#### Scenario: 未确认终止（预览模式）
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为 12345，`confirm` 为 false
- **THEN** 系统返回进程信息预览，不实际终止进程

#### Scenario: 终止失败（权限不足）
- **WHEN** 用户调用 `process_kill` 工具，参数 `pid` 为系统进程 PID，`confirm` 为 true
- **THEN** 系统返回错误："终止进程失败：权限不足"