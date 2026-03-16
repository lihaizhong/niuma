## Context

当前渠道系统在 `niuma/channels/` 目录下实现了多个第三方渠道的接入，包括 CLI、Telegram、Discord、Email、Feishu、QQ、Slack、WhatsApp、钉钉等。渠道通过 `index.ts` 统一导出，通过 `registry.ts` 进行注册。

**当前架构：**

```
channels/
├── index.ts        # 统一导出所有渠道类和类型
├── registry.ts     # 渠道注册表，导入并创建渠道实例
├── base.ts         # 基类
├── cli/            # CLI 渠道 ✓ 保留
├── discord/        # Discord 渠道 ✓ 保留
├── email/          # Email 渠道 ✓ 保留
├── feishu/         # 飞书渠道 ✓ 保留
├── qq/             # QQ 渠道 ✓ 保留
├── telegram/       # Telegram 渠道 ✗ 禁用
├── slack/          # Slack 渠道 ✗ 禁用
├── whatsapp/       # WhatsApp 渠道 ✗ 禁用
└── dingtalk/       # 钉钉渠道 ✗ 禁用
```

**禁用原因：**
- `dingtalk-sdk` 需要钉钉运行环境，Node.js 中无法正常工作
- `slack`、`telegram`、`whatsapp` 暂时不使用，减少依赖

## Goals / Non-Goals

**Goals:**
- 禁用四个渠道的导入，确保 CLI 正常启动
- 保留代码实现，便于后续重新启用
- 保持代码结构清晰，添加注释说明禁用原因

**Non-Goals:**
- 不删除任何实现代码
- 不修改渠道配置 schema
- 不修改其他正常工作的渠道

## Decisions

### 1. 采用注释方式禁用而非条件导入

**选择：** 使用 `//` 注释禁用导入语句

**原因：**
- 简单直接，易于后续恢复
- 不引入额外的配置复杂度
- TypeScript 编译时会完全忽略注释掉的代码

**替代方案：**
- 使用环境变量控制：增加运行时复杂度，当前场景不需要
- 使用构建时条件编译：需要额外工具链配置

### 2. 在两处文件中进行修改

**文件：**
1. `niuma/channels/index.ts` - 注释掉导出语句
2. `niuma/channels/registry.ts` - 注释掉导入和 case 分支

**原因：** 这两处是渠道的入口点，修改后可完全阻断渠道加载

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 后续需要重新启用时需要手动取消注释 | 在注释中标注 TODO 和原因 |
| 用户配置了禁用的渠道会报错 | 渠道配置验证时需要处理未知类型 |
