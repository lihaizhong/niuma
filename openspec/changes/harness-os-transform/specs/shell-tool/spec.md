# Shell Tool Specification (Delta)

## Purpose

扩展 Shell Tool 支持沙箱执行模式。

## MODIFIED Requirements

### Requirement: exec 工具执行 Shell 命令

**FROM:**
> 系统 SHALL 提供 exec 工具，能够安全地执行 Shell 命令并返回结果。

**TO:**
> 系统 SHALL 提供 exec 工具，支持直接执行和沙箱执行两种模式。

#### Scenario: 执行沙箱模式命令
- **WHEN** Agent 调用 exec 并设置 `mode: "sandbox"`
- **THEN** 系统通过 SandboxManager 执行命令
- **AND** 返回沙箱隔离执行结果

#### Scenario: 执行直接模式命令
- **WHEN** Agent 调用 exec 并设置 `mode: "direct"` 或未指定
- **THEN** 系统在主机直接执行命令
- **AND** 应用黑名单防护

### Requirement: 危险命令防护

**FROM:**
> 系统 SHALL 实现危险命令黑名单，防止执行危险操作。

**TO:**
> 系统 SHALL 实现危险命令防护，直接模式下使用黑名单，沙箱模式下由容器资源限制防护。

#### Scenario: 沙箱模式跳过黑名单
- **WHEN** exec 调用使用 `mode: "sandbox"`
- **THEN** 系统跳过黑名单检查
- **AND** 依赖沙箱资源限制防护

#### Scenario: 直接模式使用黑名单
- **WHEN** exec 调用使用 `mode: "direct"`
- **THEN** 系统执行黑名单检查
- **AND** 应用确认机制

## ADDED Requirements

### Requirement: 沙箱模式参数

exec 工具 SHALL 支持沙箱执行参数。

#### Scenario: 指定沙箱镜像
- **WHEN** Agent 提供 `sandboxImage` 参数
- **THEN** 系统使用指定镜像创建容器
- **AND** 使用默认镜像如果未指定

#### Scenario: 沙箱网络配置
- **WHEN** Agent 提供 `sandboxNetwork: "isolated"`
- **THEN** 容器无外部网络访问
- **WHEN** Agent 提供 `sandboxNetwork: "permitted"`
- **THEN** 容器有外部网络访问

## Dependencies

- Requires: `sandbox-environment` for sandbox execution
