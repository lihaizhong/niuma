## 1. Setup

- [x] 1.1 安装依赖：`pnpm add ps-tree @types/ps-tree`
- [x] 1.2 创建文件：`niuma/agent/tools/system.ts`
- [x] 1.3 创建测试文件：`niuma/__tests__/system-tools.test.ts`

## 2. Environment Variables Implementation

- [x] 2.1 实现 EnvGetTool 类（读取环境变量）
- [x] 2.2 实现 EnvSetTool 类（设置环境变量）
- [x] 2.3 添加环境变量名称格式验证函数

## 3. Process Management Implementation

- [x] 3.1 实现 ProcessListTool 类（列出进程）
- [x] 3.2 实现 ProcessKillTool 类（终止进程）
- [x] 3.3 添加受保护进程列表检查函数
- [x] 3.4 添加进程树终止函数

## 4. Tool Registration

- [x] 4.1 在 registry.ts 中导入新的工具类
- [x] 4.2 在工具注册表中注册 4 个新工具
- [x] 4.3 验证工具注册数量（从 26 增加到 30）

## 5. Testing

- [x] 5.1 编写 EnvGetTool 测试用例（5 个场景）
- [x] 5.2 编写 EnvSetTool 测试用例（6 个场景）
- [x] 5.3 编写 ProcessListTool 测试用例（6 个场景）
- [x] 5.4 编写 ProcessKillTool 测试用例（10 个场景）
- [x] 5.5 编写辅助函数测试用例（环境变量验证、受保护进程检查）
- [x] 5.6 运行测试：`pnpm test system-tools.test.ts`
- [x] 5.7 确保所有测试通过（28 个测试用例）

## 6. Documentation

- [x] 6.1 更新 CHANGELOG.md（添加 v0.1.4 版本）
- [x] 6.2 更新 AGENTS.md 中的开发计划（标记 Phase 3.7 为已完成）
- [x] 6.3 更新 package.json 版本号为 0.1.4