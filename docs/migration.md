# 迁移指南：从旧 niuma 到 DeepAgent

## 概述

niuma 已使用 DeepAgent 模式完全重写，代码量减少 94%，架构更清晰。

## 主要变更

### 1. API 变更

**旧代码：**
```typescript
import { AgentLoop } from "niuma/agent/loop";

const loop = new AgentLoop(config);
const response = await loop.run(messages);
```

**新代码：**
```typescript
import { createAgent } from "niuma";

const agent = createAgent({
  provider: openaiProvider,
  maxIterations: 40,
});
const response = await agent.chat(messages);
```

### 2. Provider 变更

**旧代码：**
```typescript
import { ProviderRegistry } from "niuma/providers/registry";

const registry = new ProviderRegistry();
registry.register("openai", new OpenAIProvider(config));
```

**新代码：**
```typescript
import { ProviderRegistry, OpenAIProvider } from "niuma";

const registry = new ProviderRegistry();
registry.register("openai", new OpenAIProvider(config));
```

### 3. 工具系统变更

**旧代码：**
```typescript
import { ToolRegistry } from "niuma/agent/tools/registry";
import { ReadFileTool } from "niuma/agent/tools/filesystem";

const registry = new ToolRegistry();
registry.register(new ReadFileTool());
```

**新代码：**
```typescript
import { ToolRegistry, readFileTool } from "niuma";

const registry = new ToolRegistry();
registry.register(readFileTool);
```

### 4. 配置变更

**旧代码：**
```typescript
import { ConfigManager } from "niuma/config/manager";

const config = await ConfigManager.load("config.json");
```

**新代码：**
```typescript
import { ConfigManager } from "niuma";

const manager = new ConfigManager();
const config = manager.load("config.json");
```

## 移除的功能

以下功能在新版本中暂时移除：

- 沙箱执行系统（sandbox）
- 任务跟踪器（task-tracker）
- 心跳服务（heartbeat）
- 内存压缩（compaction）
- 规则引擎（rules）
- 复杂的审批流程（approval）

如需这些功能，请使用 niuma-backup/ 目录中的旧代码作为参考。

## 优势

- ✅ 代码量减少 94%（34,036 → 2,069 行）
- ✅ 纯函数架构，更易测试
- ✅ 无 God Class，单文件最大 97 行
- ✅ 依赖注入，无全局状态
- ✅ TypeScript 类型更安全

## 回滚

如需回滚到旧版本：
```bash
git checkout main  # 或其他分支
cp -r niuma-backup/* niuma/
```
