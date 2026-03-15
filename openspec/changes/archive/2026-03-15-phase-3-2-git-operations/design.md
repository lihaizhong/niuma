## Context

Niuma 智能体当前具备文件系统操作、Shell 命令执行、Web 请求等工具，但缺乏 Git 版本控制能力。这限制了智能体在代码仓库管理、版本发布、协作开发等场景下的自动化能力。

当前工具框架已建立（`niuma/agent/tools/base.ts` 和 `registry.ts`），Shell 工具（`shell.ts`）提供了危险命令黑名单防护机制。Git 操作工具将复用现有的工具框架和安全性设计。

## Goals / Non-Goals

**Goals:**
- 实现 6 个 Git 操作工具：git_status、git_commit、git_push、git_pull、git_branch、git_log
- 提供完整的参数验证和错误处理
- 确保工具输出格式化且易读
- 遵循现有的 Tool 抽象类模式
- 添加完整的单元测试

**Non-Goals:**
- 实现高级 Git 操作（如 rebase、cherry-pick、stash 等）
- Git 图形化界面
- Git 钩子管理
- 多仓库并行操作

## Decisions

### 1. Git 命令执行方式

**决策：** 使用 `child_process.exec` 异步执行 Git 命令

**理由：**
- 异步执行避免阻塞主线程
- 与现有的 Shell 工具（`exec`）保持一致
- 支持设置工作目录和环境变量
- 便于捕获 stdout、stderr 和 exit code

**替代方案考虑：**
- `execSync`：同步执行会阻塞，不符合项目异步模式
- `simple-git` 库：增加外部依赖，而 Node.js 原生支持已足够
- Git 原生绑定：复杂度高，增加构建难度

### 2. 工作目录管理

**决策：** 所有 Git 操作在项目根目录（`process.cwd()`）执行

**理由：**
- 符合 CLI 工具的使用场景（通常在项目根目录运行）
- 简化实现，避免路径复杂性
- 与现有 Shell 工具的行为一致

**替代方案考虑：**
- 支持自定义工作目录参数：增加复杂度，实际需求不明确
- 自动检测 Git 仓库：增加检测逻辑，错误处理复杂

### 3. 工具实现模式

**决策：** 使用 `SimpleTool` 抽象类，每个 Git 操作创建独立的工具实例

**理由：**
- 遵循 nanobot 的 Tool 设计模式
- 与现有文件系统工具（`read_file`、`write_file`）保持一致
- 每个工具有独立的参数验证和错误处理
- 便于单独测试和维护

**替代方案考虑：**
- 单一 Git 工具 + 子命令：不符合 Tool 设计模式
- 继承 Tool 抽象类：增加样板代码，`SimpleTool` 更简洁

### 4. 输出格式化

**决策：** Git 原始输出经过格式化处理，提供易读的文本输出

**理由：**
- Git 原始输出可能包含 ANSI 颜色代码，需要清理
- 结构化输出（如 JSON）便于 LLM 理解
- 避免输出冗余信息

**示例：**
- `git_status`：简化文件状态为 "M filename" 格式
- `git_log`：限制输出行数，使用简洁格式
- `git_branch`：清晰标记当前分支

### 5. 安全性考虑

**决策：** Git 操作不添加额外的安全限制，但遵循 Shell 工具的安全模式

**理由：**
- Git 命令本身相对安全（不涉及系统级操作）
- 已有 Shell 工具的危险命令黑名单防护
- Git 操作通常在项目目录内，影响范围有限

**安全措施：**
- 验证 Git 仓库存在性
- 捕获并处理 Git 命令错误
- 避免执行可能破坏仓库的操作（如 `git reset --hard`）

## Risks / Trade-offs

### 风险 1：Git 未安装或不可用

**风险：** 系统未安装 Git 或 Git 不在 PATH 中

**缓解措施：**
- 在工具初始化时检测 Git 可用性
- 提供清晰的错误信息提示用户安装 Git
- 在文档中说明依赖要求

### 风险 2：非 Git 目录执行操作

**风险：** 在非 Git 仓库目录执行 Git 命令会失败

**缓解措施：**
- 在执行 Git 命令前检测当前目录是否为 Git 仓库
- 提供友好的错误信息

### 风险 3：Git 命令执行超时

**风险：** 某些 Git 操作（如 `git push` 到远程）可能超时

**缓解措施：**
- 为所有 Git 命令设置合理的超时时间（如 30 秒）
- 在错误信息中提示用户可能的原因

### 权衡 1：输出详细程度 vs 简洁性

**权衡：** Git 输出过于详细会增加 LLM 理解难度，过于简洁可能丢失关键信息

**决策：** 平衡详细程度，提供关键信息的简洁输出
- `git_status`：显示文件路径和状态
- `git_log`：显示 commit hash、作者、消息
- `git_branch`：显示分支列表和当前分支

### 权衡 2：功能完整性 vs 实现复杂度

**权衡：** Git 有数百个子命令，实现全部功能复杂度高

**决策：** 聚焦最常用的 6 个操作，满足核心需求
- 未来可以根据需求扩展更多 Git 操作

## Architecture

```
niuma/agent/tools/
├── base.ts           # Tool 抽象基类
├── registry.ts       # 工具注册表
├── shell.ts          # Shell 命令工具（参考）
└── git.ts            # Git 操作工具（新增）
    ├── GitStatusTool
    ├── GitCommitTool
    ├── GitPushTool
    ├── GitPullTool
    ├── GitBranchTool
    └── GitLogTool

niuma/agent/tools/__tests__/
└── git.test.ts       # Git 工具单元测试（新增）
```

## Testing Strategy

- **单元测试**：每个工具独立测试，覆盖正常流程和错误场景
- **Mock Git 命令**：使用 `child_process` mock 避免实际执行 Git
- **测试场景**：
  - Git 仓库检测
  - 正常命令执行
  - 错误处理（非 Git 目录、命令失败）
  - 输出格式验证
- **测试覆盖率**：目标 > 90%