## 1. 基础设施

- [x] 1.1 创建 `niuma/agent/tools/git.ts` 文件
- [x] 1.2 定义 Git 命令执行辅助函数（execGit）
- [x] 1.3 添加 Git 仓库检测函数（isGitRepository）
- [x] 1.4 添加输出格式化函数（formatGitOutput）

## 2. Git Status 工具

- [x] 2.1 实现 GitStatusTool 类
- [x] 2.2 定义 git_status 工具的输入参数 Schema
- [x] 2.3 实现 git_status 工具的执行逻辑
- [x] 2.4 添加错误处理（非 Git 目录、命令失败）

## 3. Git Commit 工具

- [x] 3.1 实现 GitCommitTool 类
- [x] 3.2 定义 git_commit 工具的输入参数 Schema（message、files）
- [x] 3.3 实现 git_commit 工具的执行逻辑
- [x] 3.4 添加错误处理（无更改、空消息、暂存失败）

## 4. Git Push 工具

- [x] 4.1 实现 GitPushTool 类
- [x] 4.2 定义 git_push 工具的输入参数 Schema（remote、branch）
- [x] 4.3 实现 git_push 工具的执行逻辑
- [x] 4.4 添加错误处理（远程不存在、认证失败、本地落后）

## 5. Git Pull 工具

- [x] 5.1 实现 GitPullTool 类
- [x] 5.2 定义 git_pull 工具的输入参数 Schema（remote、branch）
- [x] 5.3 实现 git_pull 工具的执行逻辑
- [x] 5.4 添加错误处理（远程不存在、合并冲突、认证失败）

## 6. Git Branch 工具

- [x] 6.1 实现 GitBranchTool 类
- [x] 6.2 定义 git_branch 工具的输入参数 Schema（operation、name）
- [x] 6.3 实现 git_branch 工具的执行逻辑（list、create、delete）
- [x] 6.4 添加错误处理（分支已存在、删除当前分支、分支不存在）

## 7. Git Log 工具

- [x] 7.1 实现 GitLogTool 类
- [x] 7.2 定义 git_log 工具的输入参数 Schema（count、branch）
- [x] 7.3 实现 git_log 工具的执行逻辑
- [x] 7.4 添加错误处理（分支不存在、输出截断）

## 8. 工具注册

- [x] 8.1 在工具注册表中注册所有 Git 工具
- [x] 8.2 导出 Git 工具模块
- [x] 8.3 更新工具索引（如果需要）

## 9. 测试

- [x] 9.1 创建 `niuma/agent/tools/__tests__/git-tools.test.ts` 测试文件
- [x] 9.2 编写 Git 命令执行辅助函数测试
- [x] 9.3 编写 GitStatusTool 单元测试
- [x] 9.4 编写 GitCommitTool 单元测试
- [x] 9.5 编写 GitPushTool 单元测试
- [x] 9.6 编写 GitPullTool 单元测试
- [x] 9.7 编写 GitBranchTool 单元测试
- [x] 9.8 编写 GitLogTool 单元测试
- [x] 9.9 运行测试确保全部通过（16/16 通过）

## 10. 验证

- [x] 10.1 运行类型检查（pnpm type-check）- 通过
- [x] 10.2 运行代码检查（pnpm lint）- 通过（Git 工具无错误）
- [x] 10.3 运行构建（pnpm build）- 通过
- [x] 10.4 手动测试所有 Git 工具功能 - 全部通过
- [x] 10.5 更新开发计划文档 - 已完成